const NB_ID = "nb_id";
const MY_ORDER = "my_order";
const CUR_SOURCE = "cur_source";
const CELLS_LIST = "cells_list";    

const OFFSET = 30;
const R = 15;
var lastClosestId = "";
var lastChosenId = "";

function findClosestId(mouseX: number, mouseY: number) {
    var column = 0;
    if (mouseX >= OFFSET - R && mouseX <= OFFSET + R) {
        column = 1;
    }
    const width = get_elem('canvas').width;
    const height = get_elem('canvas').height;
    const rightPos = width - OFFSET;
    if (mouseX >= rightPos - R && mouseX <= rightPos + R) {
        column = 2;
    }
    if (column == 0) {
        return "";
    }
    const nb_id = get_current_nb_id();
    if (nb_id == "") {
        return "";
    }
    const correct_order = correctOrders[nb_id];
    if (correct_order == null) {
        return "";
    }
    const my_order = get_my_order();
    if (my_order.length == 0) {
        return "";
    }

    const len = correct_order.length;
    const delta = (height - OFFSET * 2) / len;
    var expected_pos = Math.round((mouseY - OFFSET) / delta);
    if (expected_pos < 0) {
        expected_pos = 0;
    }
    if (expected_pos >= len) {
        expected_pos = len - 1;
    }
    if (column == 1) {
        return correct_order[expected_pos];
    } else {
        return my_order[expected_pos];
    }
}

class DrawingApp {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor() {
        let canvas = document.getElementById('canvas') as
            HTMLCanvasElement;
        let context = canvas.getContext("2d");
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 1;

        this.canvas = canvas;
        this.context = context;

        // this.redraw();
        this.redraw2(true);
        this.createUserEvents();
    }

    private createUserEvents() {
        let canvas = this.canvas;

        canvas.addEventListener("mousedown", this.pressEventHandler);
        canvas.addEventListener("mousemove", this.dragEventHandler);
        canvas.addEventListener("mouseup", this.releaseEventHandler);
        canvas.addEventListener("mouseout", this.cancelEventHandler);

        canvas.addEventListener("touchstart", this.pressEventHandler);
        canvas.addEventListener("touchmove", this.dragEventHandler);
        canvas.addEventListener("touchend", this.releaseEventHandler);
        canvas.addEventListener("touchcancel", this.cancelEventHandler);
    }


    public redraw2(full : boolean) {
        // this.canvas.width = this.canvas.offsetWidth;
        this.clearCanvas();
        const nb_id = get_current_nb_id();
        if (nb_id == "") {
            return;
        }
        const correct_order = correctOrders[nb_id];
        if (correct_order == null) {
            return;
        }
        const my_order = get_my_order();
        if (my_order.length == 0) {
            return;
        }
        const height = this.context.canvas.height;
        const width = this.context.canvas.width;

        function get_y(pos: number) {
            return OFFSET + (height - OFFSET * 2) * pos / correct_order.length;
        }

        const ctx = this.context;
        for (let i = 0; i < correct_order.length; i++) {
            const y1 = get_y(i);
            const my_pos = my_order.indexOf(correct_order[i]);
            if (my_pos == null) {
                continue;
            }
            const y2 = get_y(my_pos);

            ctx.beginPath();
            ctx.moveTo(OFFSET, y1);
            ctx.lineTo(width - OFFSET, y2);
            if (currentNb.nb_id == nb_id) {
                const cell_type = currentNb.cell_type[correct_order[i]];
                if (cell_type == "markdown") {
                    ctx.strokeStyle = 'black';
                } else if (cell_type == "code") {
                    ctx.strokeStyle = 'blue';
                } else {
                    throw "bad cell_type";
                }
            } else {
                console.log('current nb is different. nb_id=', nb_id, '. loaded:', currentNb.nb_id);
                ctx.strokeStyle = 'black';
            }
            if (correct_order[i] == lastChosenId) {
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = 2;
            } else
                if (correct_order[i] == lastClosestId) {
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 2;
                } else {
                    ctx.lineWidth = 1;
                }
            ctx.stroke();
            ctx.closePath();

        }

        
        if (full) {
            const all_cells = get_elem(CELLS_LIST); 
            all_cells.textContent = '';

            if (currentNb.nb_id == nb_id) {
                let my_pos = my_order.indexOf(lastChosenId);
                while (my_pos != my_order.length && currentNb.cell_type[my_order[my_pos]] != "code") {
                    my_pos += 1;
                }
                const next_code_cell_id = my_pos == my_order.length ? 'END' : my_order[my_pos];
                const show_chosen_cell = currentNb.cell_type[lastChosenId] == "markdown";

                for (let i = 0; i < correct_order.length; i++) {
                    const cell_id = correct_order[i];
                    const cell_type = currentNb.cell_type[cell_id];
                    if (show_chosen_cell) {
                        if (cell_id == next_code_cell_id) {
                            const new_cell = document.createElement('pre');
                            new_cell.setAttribute('id', 'my_cell');
                            new_cell.textContent = currentNb.source[lastChosenId];
                            all_cells.appendChild(new_cell);
                        }
                        if (cell_id == lastChosenId) {
                            const new_cell = document.createElement('pre');
                            new_cell.setAttribute('id', 'correct_cell');
                            new_cell.textContent = currentNb.source[cell_id];
                            all_cells.appendChild(new_cell);
                        }
                    }
                    if (cell_type == "code") {
                        const new_cell = document.createElement('pre');
                        new_cell.setAttribute('id', 'cell');
                        new_cell.textContent = currentNb.source[cell_id];
                        all_cells.appendChild(new_cell);
                    }
                    
                }
            }

        }
    }


    private pressEventHandler = (e: MouseEvent | TouchEvent) => {
        this.addClick();
    }

    private dragEventHandler = (e: MouseEvent | TouchEvent) => {
        let mouseX = (e as TouchEvent).changedTouches ?
            (e as TouchEvent).changedTouches[0].pageX :
            (e as MouseEvent).x;
        let mouseY = (e as TouchEvent).changedTouches ?
            (e as TouchEvent).changedTouches[0].pageY :
            (e as MouseEvent).y;
        var rect = this.canvas.getBoundingClientRect();
        mouseX -= rect.left;
        mouseY -= rect.top;

        const closestId = findClosestId(mouseX, mouseY);
        if (closestId != lastClosestId) {
            lastClosestId = closestId;
            this.redraw2(false);
        }

        e.preventDefault();
    }

    private clearEventHandler = () => {
        this.clearCanvas();
    }

    private releaseEventHandler = () => {

    }

    private cancelEventHandler = () => {

    }

    private addClick() {
        lastChosenId = lastClosestId;
        // console.log('selected cell id:', lastChosenId);
        this.redraw2(true);
    }

    private clearCanvas() {
        this.context
            .clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

const app = new DrawingApp();

import { parse } from 'papaparse';

interface HashTable<T> {
    [key: string]: T;
}

var correctOrders: HashTable<string[]> = {};

function save_local(key: string, value: string) {
    if (value == "") {
        window.localStorage.removeItem(key);
    } else {
        window.localStorage.setItem(key, value);
    }
}

function get_local(key: string) {
    return window.localStorage.getItem(key);
}

function get_elem(id: string) {
    const e = document.getElementById(id);
    if (e == null) {
        return null;
    }
    return (<HTMLInputElement>e);
}

const fetchOrders = async () => {
    const response = await fetch('http://localhost:8000/AI4Code/train_orders.csv');
    const data = await response.text();

    parse<Array<string>>(data, {
        complete: (result) => {
            const data = result.data;
            for (let i = 1; i < data.length - 1; i++) {
                const item = data[i];
                correctOrders[item[0]] = item[1].split(" ");
            }
            console.log("done2!");
            app.redraw2(true);
            reloadNotebook();
        }
    })

}


function get_order_key(nb_id: string) {
    return MY_ORDER + "_" + nb_id;
}

function setChangeHandlerNbId() {
    const elem = get_elem(NB_ID);
    elem.value = get_local(NB_ID);

    function reload_order() {
        get_elem(MY_ORDER).value = get_local(get_order_key(elem.value));
        app.redraw2(true);
        // reloadNotebook();
    }

    reload_order();
    elem.onkeyup = (_e: KeyboardEvent) => {
        save_local(NB_ID, elem.value);
        reload_order();
    };
}

function get_current_nb_id() {
    const e = get_elem(NB_ID);
    if (e == null) {
        return "";
    }
    return e.value;
}

function get_my_order() {
    const e = get_elem(MY_ORDER);
    if (e == null) {
        return [];
    }
    return e.value.trim().split(",");
}

function setChangeHandlerMyOrder() {
    const elem = get_elem(MY_ORDER);
    elem.onkeyup = (_e: KeyboardEvent) => {
        save_local(get_order_key(get_current_nb_id()), elem.value);
        app.redraw2(true);
    };
}

function setInputHandlers() {
    setChangeHandlerNbId();
    setChangeHandlerMyOrder();
};

setInputHandlers();
fetchOrders();

type Notebook = {
    nb_id: string,
    cell_type: HashTable<string>,
    source: HashTable<string>,
};

var currentNb: Notebook = {
    nb_id: "",
    cell_type: {},
    source: {}
};

const reloadNotebook = async () => {
    const nb_id = get_current_nb_id();
    if (nb_id == "") {
        return;
    }
    if (currentNb.nb_id == nb_id) {
        return;
    }
    const correct_order = correctOrders[nb_id];
    if (correct_order.length == 0) {
        return;
    }
    console.log('reload', nb_id);
    const response = await fetch('http://localhost:8000/AI4Code/train/' + nb_id + '.json');
    const data = await response.json();
    console.log(data);
    console.log(data['cell_type']);
    currentNb = {
        nb_id,
        cell_type: data['cell_type'],
        source: data['source']
    };
    console.log('reloaded');
    app.redraw2(true);
}

(function my_func() {
    reloadNotebook();
    setTimeout( my_func, 500 );
})();
