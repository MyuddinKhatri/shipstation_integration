(() => {
  // ../shipstation_integration/shipstation_integration/public/js/shipping.js
  if (!window.shipping)
    window.shipping = {};
  shipping.shipstation = (frm) => {
    shipping.build_carrier_options(frm);
    shipping.add_label_button(frm);
  };
  shipping.build_carrier_options = (frm) => {
    frappe.call({
      method: "shipstation_integration.shipping.get_shipstation_settings",
      args: { doc: frm.doc },
      callback: (r) => {
        if (r.message) {
          frappe.call({
            method: "shipstation_integration.shipping.get_carrier_services",
            args: { settings: r.message },
            callback: (services) => {
              if (services.message) {
                shipping.carrier_options = services.message;
              }
            }
          });
        }
      }
    });
  };
  shipping.add_label_button = (frm) => {
    $(".btn").find(".fa-tags").closest(".btn").remove();
    if (frm.doc.docstatus !== 1)
      return;
    frappe.call({
      method: "shipstation_integration.shipping.get_shipstation_settings",
      args: { doc: frm.doc },
      callback: (r) => {
        if (r.message) {
          frappe.db.get_value("Shipstation Settings", { name: r.message }, "enable_label_generation").then((settings) => {
            if (settings.message.enable_label_generation) {
              frm.add_custom_button(`<i class="fa fa-tags"></i> Shipping Label`, () => {
                if (!shipping.carrier_options) {
                  frappe.throw(__(`No carriers found to process labels. Please ensure the current
										document is connected to Shipstation.`));
                } else {
                  shipping.dialog(frm);
                }
              });
            }
          });
        }
      }
    });
  };
  shipping.dialog = (frm) => {
    const warnings = shipping.get_label_warnings(frm);
    const options = shipping.carrier_options.map((a) => a.nickname || a.name).join("\n");
    const fields = [
      { fieldname: "warnings", fieldtype: "HTML" },
      { fieldname: "sb_label", fieldtype: "Section Break" },
      {
        fieldname: "ship_method_type",
        fieldtype: "Select",
        label: "Carrier",
        options,
        onchange: () => {
          const values = dialog.get_values();
          if (values.ship_method_type) {
            const carrier = shipping.carrier_options.find((a) => (a.nickname || a.name) === values.ship_method_type);
            const packages = carrier.packages.map((a) => a.name).join("\n");
            dialog.set_df_property("package", "options", packages);
            dialog.set_df_property("package", "read_only", 0);
            const services = carrier.services.map((a) => a.name).join("\n");
            dialog.set_df_property("service", "options", services);
            dialog.set_df_property("service", "read_only", 0);
          }
        }
      },
      { fieldname: "service", fieldtype: "Select", label: "Service", read_only: 1 },
      { fieldname: "package", fieldtype: "Select", label: "Package Type", read_only: 1 },
      { fieldname: "cb_label", fieldtype: "Column Break" },
      { fieldname: "gross_weight", fieldtype: "Float", label: "Gross Weight", description: `Total Net Weight: ${frm.doc.total_net_weight}` },
      { fieldname: "total_packages", fieldtype: "Int", label: "Total Packages", description: `Total number of items: ${frm.doc.total_qty}` }
    ];
    const dialog = new frappe.ui.Dialog({
      title: __("Create and Attach Shipping Label"),
      fields,
      primary_action: () => {
        dialog.hide();
        shipping.create_shipping_label(frm, dialog.get_values());
      }
    });
    dialog.fields_dict.warnings.$wrapper.html(warnings);
    dialog.show();
    dialog.$wrapper.find(".modal-dialog").css("width", "900px");
  };
  shipping.create_shipping_label = (frm, values) => {
    frappe.call({
      method: "shipstation_integration.shipping.create_shipping_label",
      args: { doc: frm.doc, values },
      freeze: true,
      callback: (r) => {
        if (!r.exc) {
          frm.reload_doc();
        }
      }
    });
  };
  shipping.get_label_warnings = (frm) => {
    return frm.doc.customer_address ? "" : `<p style="color: red;">A customer address is required to create a label.</p>`;
  };

  // frappe-html:/home/myuddin/Projects/parsimony-v14/apps/shipstation_integration/shipstation_integration/templates/includes/carriers.html
  frappe.templates["carriers"] = `<table class="table table-hover">
  <thead>
    <tr>
      <th class="col col-md-1">Name</th>
      <th class="col col-md-1">Nickname</th>
      <th class="col col-md-1">Account Number</th>
      <th class="col col-md-1">Primary</th>
      <th class="col col-md-4">Services</th>
      <th class="col col-md-4">Packages</th>
    </tr>
  </thead>
  <tbody>
    {% for (let carrier of carriers) { %}
      <tr>
        <td>{{ carrier.name }}</td>
        <td>{{ carrier.nickname }}</td>
        <td>{{ carrier.account_number }}</td>
        <td>{{ carrier.primary ? "<b>Primary</b>" : "" }}</td>
        <td>
          <ul style="list-style-type: none;">
            {% for (let service of carrier.services) { %}
              <li>{{ service.name }}</li>
            {% } %}
          </ul>
        </td>
        <td>
          <ul style="list-style-type: none;">
            {% for (let package of carrier.packages) { %}
              <li>{{ package.name }}</li>
            {% } %}
          </ul>
        </td>
      </tr>
    {% } %}
  </tbody>
</table>`;
})();
//# sourceMappingURL=shipstation_integration.bundle.XMIPNBYS.js.map
