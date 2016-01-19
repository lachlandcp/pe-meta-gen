$(document).ready(function () {
    $("#options input, #options button, #options select").prop('disabled', false); // weird browser stuff keeps the disabled property
    fetchMode();
    fetchFlood();
});

$(document).mouseup(function (e) {

    var container = $("#name_selector");

    if (!container.is(e.target) // if the target of the click isn't the container...
        && container.has(e.target).length === 0) // ... nor a descendant of the container
    {
        container.hide();
    }
});

var tile_size = 16;

var defaults = [];
var urls = {
    "items": "http://zhuoweizhang.net/mcpetexturenames/items.meta",
    "blocks": "http://zhuoweizhang.net/mcpetexturenames/terrain.meta"
};

var mode = 'items';
var image = {};
var opened_menu_id;
var flood = false;
var object;

$("#go").on('click', function (e) {
    $("#options input, #options button, #options select").prop('disabled', true);
    fetchNames();
});

$("#mode").on('change', function (e) {
    fetchMode();
});

$("#flood").on('change', function (e) {
    fetchFlood();
});

$("#name_selector select").on('mouseup change', function (e) {
    updateValue();
});

$("#table").on('click', ".tile-select", function (e) {
    opened_menu_id = $(this).closest('tr').attr("data-id");

    var o = $(this).offset();
    var top = o.top + 'px';
    var left = o.left + $(elem).closest("td").width() + 'px';

    $("#name_selector").prop('defaultSelected');
    $("#name_selector").css("top", top).css("left", left).show();
});

$("#custom_name").on('keyup', function (e) {
    var val = $(this).val();
    if (val == "") val = "_";
    $("tr[data-id=" + opened_menu_id + "] button").html(val);
});

$("#submit").on('click', function (e) {

    var meta = [];

    $("tbody tr").each(function (k, v) {

        var name = $(this).find("button").html().trim();

        if (name !== "Blank") {

            var button_id = $(this).attr("data-id").split('-');
            var duplicate = -1;
            comment = "Col: " + button_id[0] + " Row: " + button_id[1];

            for (var i = 0; i < meta.length; i++) {
                if (meta[i].name == name) {
                    duplicate = i;
                }
            }

            if (duplicate > -1) {
                meta[duplicate].uvs.push(getUv(button_id[0], button_id[1]));
            } else {
                var uvs = [];
                uvs.push(getUv(button_id[0], button_id[1]));

                meta.push({
                    "name": name,
                    "uvs": uvs,
                    "__comment": comment
                });
            }
        }
    });

    $("#result").append($("<textarea></textarea>").html(JSON.stringify(meta, null, 2)));
});

function fetchMode() {

    mode = $("#mode").val();
    console.log("Mode changed to: " + mode);
}

function fetchFlood() {

    flood = $("#flood").prop('checked');
    console.log("Flood changed to: " + flood);
}

function fetchNames() {

    var url = urls[mode];

    var arr = [];
    $.getJSON(url, function (data) {
        if (flood) {
            object = data;
        }
        for (i = 0; i < data.length; i++) {
            arr.push(data[i].name);
        }
        defaults = arr;

        generateImage();
    });

}

function generateImage() {

    $("#table").html("Loading...");
    if ($("#image")[0].files[0]) {

        var reader = new FileReader();
        var file = $("#image")[0].files[0];

        reader.onloadend = function () {
            var result = reader.result;
            console.log(result);

            var img = new Image();
            img.src = result;
            img.onerror = function () {
                alert("Invalid file type");
                reset();
                return;
            };

            img.onload = function () {
                image.width = this.width;
                image.height = this.height;
                image.url = result;
                image.rows = image.height / tile_size;
                image.cols = image.width / tile_size;

                if (image.rows * image.height < defaults.length) {
                    alert("Not enough tiles! Must have at least enough for all the default items.");
                    reset();
                    return;
                }

                table();
            }
        };

        reader.readAsDataURL(file);
    } else {
        alert('Please supply the image file!');
        reset();
        return;
    }
}

function table() {

    $('<style type="text/css"> .tile{ background-image: url("' + image.url + '"); background-size: ' + image.width * 2 + 'px ' + image.height * 2 + 'px } </style>').appendTo('head');

    var table = $('<table></table>');
    table.append("<thead><tr><td>Texture</td><td>Texture name</td></tr></thead>");

    for (var y = 0; y < (image.height / 16); y++) {
        for (var x = 0; x < (image.width / 16); x++) {
            var row = $('<tr></tr>').attr("data-id", x + '-' + y);
            var ix = 0 - (32 * x);
            var iy = 0 - (32 * y);
            var tile = $('<span></span>').addClass('tile').css('background-position', ix + 'px ' + iy + 'px');
            var tiletd = $("<td></td>").addClass("tile-parent").append(tile);

            var select = $("<button></button>").addClass("tile-select").html("Blank");
            var selecttd = $("<td></td>").append(select);
            table.append(row.append(tiletd).append(selecttd));
        }
    }

    if (flood) {
        // TODO: Include blanks... somehow. Currently the flowing water textures break with this method, as there's many gaps in between. May have to calculate records using the meta coordinates... ugh
        var list = parseData();

        table.find("button").each(function (k, v) {
            if (list[k]) {
                $(this).html(list[k]);
            }
        });
    }

    $('#table').html(table);
    for (var i = 0; i < defaults.length; i++) {
        $("#name_selector select").append($("<option></option>").html(defaults[i]));
    }

    $("#submit_container").show();
}


function updateValue() {

    var result = $("#name_selector select").val();

    if (result == "Custom") {
        $("#custom_name").show();
    } else {
        $("#custom_name").hide();
        $("tr[data-id=" + opened_menu_id + "] button").html(result);
    }
}

function getUv(col, row) {

    // button_id splits a string, so we must convert col & row to numbers
    col = Number(col);
    row = Number(row);

    /* 
        [x1, y1, x2, y2, width, height]
        x1 = col * 16 / width
        y1 = row * 16 / height
        x2 = 16(col + 1) / width
        y2 = 16(row + 1) / height
    */

    var uv = [
        (tile_size * col) / image.width,
        (tile_size * row) / image.height,
        (tile_size * (col + 1)) / image.width,
        (tile_size * (row + 1)) / image.height,
        image.width,
        image.height
        ];

    for (var i = 0; i < uv.length - 2; i++) {
        uv[i] = Math.round(uv[i] * 1e4) / 1e4;
    }

    return uv;
}

function parseData() {
    var list = [];

    for (var i = 0; i < object.length; i++) {
        for (var u = 0; u < object[i].uvs.length; u++) {
            list.push(object[i].name);
        }
    }
    console.log("Returning data list");
    return list;
}

function reset() {

    $("#options input, #options button, #options select").prop('disabled', false);
    $("#options input").val("");

    $("#table").html("");
}