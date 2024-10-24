import Backbone from "backbone";
import {properties} from "../utils/record-ontology";
import {getStringLiteral} from "../utils/jsonld.model";
import {vreChannel} from "../radio";
import Tabulator from "tabulator";
import {columnChooseMenu} from "../utils/tabulator-utils";

const columnProperties = {
    'edpoprec:title': {
        visible: true,
        widthGrow: 5,
        formatter: 'textarea',
    },
    'edpoprec:placeOfPublication': {
        visible: true,
    },
    'edpoprec:dating': {
        visible: true,
        widthGrow: 0.5,
    },
    'edpoprec:publisherOrPrinter': {
        visible: true,
    },
    'edpoprec:contributor': {
        visible: true,
    },
    'edpoprec:activity': {
        visible: true,
    },
};

export var RecordListView = Backbone.View.extend({
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
                    // All columns invisible by default
                    definition.visible = false;
                    const property = properties.get(definition.field);
                    if (property) {
                        definition.title = getStringLiteral(property.get("skos:prefLabel"));
                    }
                    definition.headerFilter = true;
                    definition.headerContextMenu = columnChooseMenu;
                    const hardcodedProperties = columnProperties[definition.field];
                    if (hardcodedProperties) {
                        Object.assign(definition, hardcodedProperties);
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
            headerFilterLiveFilterDelay: 0,
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

    downloadXLSX: function() {
        this.table.download("xlsx", "edpop.xlsx", {sheetName: "EDPOP"});
    },

    downloadCSV: function() {
        this.table.download("csv", "edpop.csv");
    },
});