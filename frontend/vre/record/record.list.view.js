import Backbone from "backbone";
import {TabulatorFull as Tabulator} from "tabulator-tables";
import {properties} from "../utils/record-ontology";
import {getStringLiteral} from "../utils/jsonld.model";
import {vreChannel} from "../radio";

export var RecordListView = Backbone.View.extend({
    tagName: "div",
    id: "record-list",
    /**
     * The Tabulator instance
     * @type {Tabulator}
     */
    table: null,

    initialize: function(options) {
        this.collection.on("sync", () => {
            this.updateTable();
        });
    },

    createTable: function(initialData) {
        this.table = new Tabulator("#record-list", {
            height: 650, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
            data: initialData,
            autoColumns: true,
            autoColumnsDefinitions: (definitions) => {
                for (let definition of definitions) {
                    if (definition.field === "model") {
                        definition.visible = false;
                    }
                    const property = properties.get(definition.field);
                    if (property) {
                        definition.title = getStringLiteral(property.get("skos:prefLabel"));
                    }
                }
                return definitions;
            },
            layout: "fitColumns",
            rowHeader: {
                width: 50,
                formatter: "rowSelection",
                titleFormatter: "rowSelection",
                headerSort: false,
                resizable: false,
                frozen:true,
                headerHozAlign:"center",
                hozAlign:"center",
                cellClick:function(e, cell){
                    cell.getRow().toggleSelect();
                },
            },
        });
        this.table.on("rowClick", (e, row) => {
            const model = row.getData().model;
            vreChannel.trigger('displayRecord', model);
        });
    },

    updateTable: function() {
        const data = this.collection.toTabularData();
        if (this.table === null) {
            this.createTable(data);
        } else {
            this.table.replaceData(data);
        }
    },
});