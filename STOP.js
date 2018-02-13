/// <reference path="jquery-ui-1.8.24.min.js" />
/// <reference path="Common.js" />

var baseUrl;

var confirmDialog = function (title, message, confirmCallBackFunction, param1, denyConfirmCallBackFunction, param2) {

    var confirm = $("<div>" + message + "</div>");

    confirm.dialog({
        resizable: false,
        modal: true,
        title: title,
        height: 175,
        width: 500,
        buttons: {
            "Yes": function () {
                $(this).dialog('close');
                confirmCallBackFunction(param1);
            },
            "No": function () {

                if (denyConfirmCallBackFunction) {
                    if (param2) {
                        denyConfirmCallBackFunction(param2);
                    } else {
                        denyConfirmCallBackFunction();
                    }
                }
                $(this).dialog('close');
            }
        }
    });

}

var redirectToStationAirline = function (result) {
    window.location = result.RedirectUrl;
}

var messageDialog = function (title, message, callbackOnClose) {

    var confirm = $("<div>" + message + "</div>");

    confirm.dialog({
        resizable: false,
        modal: true,
        title: title,
        height: 200,
        width: 500,
        buttons: {
            "Ok": function () {
                if (callbackOnClose) {
                    callbackOnClose();
                }
                $(this).dialog('close');
            }
        }
    });

}

var showError = function (error) {
    messageDialog("Error", $($(error.responseText)[1]).text());
}

var $ajaxCall = function (url, data, onFailureGoToErrorPage, onFailurePopUpErrorMessage) {

    var output = {
        Successfull: false,
        SuccessResult: undefined,
        ErrorResult: undefined
    };

    var $ajax;

    if (data) {
        $ajax = $.ajax({
            url: url,
            contentType: "application/json",
            type: "POST",
            dataType: "html",
            async: false,
            data: JSON.stringify(data)
        });
    } else {
        $ajax = $.ajax({
            url: url,
            contentType: "application/json",
            type: "POST",
            dataType: "html",
            async: false,
            data: JSON.stringify(data)
        });
    }

    $ajax.success(function (result) {

        output.Successfull = true;
        output.SuccessResult = result;

    })
    .error(function (xhr, status) {
        if (onFailureGoToErrorPage) {
            window.location = baseUrl + 'Home/ErrorPage';
        } else {
            output.Successfull = false;
            output.ErrorResult = status;

            if (onFailurePopUpErrorMessage) {
                showError(xhr);
            }
        }
    });

    return output;
}

var capitalizeInput = function () {
    $(this).val($(this).val().toLocaleUpperCase());
}

var frmSelectAirportSectionValidate = function () {

    var $selectables = $(".selectAirportSection:checked");

    if ($selectables.length <= 0) {

        messageDialog("Select Airport Section", "You must select at least one airport section.");
        return false;

    } else {

        $("#frmSelectAirportSection").submit();
        return false;

    }

}

var setDefaultCarrier = function () {

    var input = $(this).val();
    
    var $drpdwn = $("#dvFlightStrip").find("#CarrierCdOACI");

    if ($drpdwn.val() == "" && input.length >= 3) {
        $drpdwn.val(input.substring(0,3));
    }

}

var assignFlightToLocation = function () {

    var $select = $(this);

    var locId = $select.val();
    var flightId = $select.attr("data-id");
    var forceAssign = $select.attr("data-force") == "Y";

    if (locId == -1) {
        return;
    }

    var data = {
        LocationId: locId,
        FlightId: flightId,
        ForceAssign: forceAssign
    };

    assignFlightLocation(data);

}

var assignFlightLocation = function (data) {

    var url = baseUrl + "Deicing/AssignFlightLocationFromColdStorage";
    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        var result = $.parseJSON(output.SuccessResult);

        if (result.ErrorMessage != "") {

            if (result.ConfirmationRequired) {
                data.ForceAssign = true;
                confirmDialog("Flight Update", result.ErrorMessage, assignFlightLocation, data);
            } else {
                messageDialog("Flight Update", result.ErrorMessage);
            }
        }

    }

}

var forceAssignFlightLocation = function ($select) {

    $select.attr("data-force", "Y");
    $select.trigger('change');

}

var forceAilineSubmit = function () {

    $("#ForceAirlineUpdate").val(true);
    $("#frmEditAircraft").submit();

}

var fnAircraftSearch = function (result) {

    $("#frmSearchAircraft").replaceWith(result.SearchView);
    $("#dvSearchFlight").html(result.ResultView);

}

var fnAirlineSearch = function (result) {

}

var fnEditAircraft = function (result) {

    if (result.ResCode == "1") {
        $(result.TargetElementId).replaceWith(result.View);
    }

    if (result.ResCode == "2") {
        //Confirm you want to force the change
        confirmDialog("Aircraft update", result.DisplayMessage, forceAilineSubmit);
    }

    if (result.ResCode == "3") {
        window.location = result.RedirectUrl;
    }

}

var fnEditAirline = function (result) {

    if (result.DisplayMessage.length > 0) {
        messageDialog("Airline Update", result.ErrorMessage);
    } else {
        window.location = result.RedirectUrl;
    }

}

var submitDelete = function () {


    $("#btnHiddenDeleteFlight").trigger("click");

    $flightEditDialog.dialog('close');
    $flightEditDialog.remove();

}

var fnValidateFlightOperation = function () {

    confirmDialog("Delete Flight", "Are you sure you want to delete the flight?", submitDelete);

}

var fnEditRecord = function (result) {

    if (result.ResCode == "1") {
        $(result.TargetElementId).replaceWith(result.View);
    }

    if (result.ResCode == "2") {
        window.location = result.RedirectUrl;
    }

}

var getStationCurrentTime = function () {

    var $input = $(this);

    if ($input.val()) {
        return;
    }

    if ($input.hasClass("updateFlight")) {

        if ($input.val() == "") {
            $input.closest(".flight").find(".clsSetServerTime").val(true);
            updateFlightInput($input);
        }

    } else {

        var url = baseUrl + "Home/GetStationCurrentTime";

        var result = $ajaxCall(url, undefined, false, true);

        var time = $.parseJSON(result.SuccessResult);

        $input.val(time.Hour + ":" + time.Minutes);

    }

}

var resumeFlightRefresh = function () {

    var hasError = false;
    var errorMessage = "";

    stopFlightsRefresh = $(".flightHeader").each(function () {
        if ($(this).hasClass("error")) {
            hasError = true;
            errorMessage = $(this).attr("title");
        }
    });

    stopFlightsRefresh = hasError;

    if (hasError) {
        messageDialog("Flight Update Error", errorMessage, function () {
            stopFlightsRefresh = false;
        });
    }

}

var updateFlightInput = function ($input) {

    var operation = $input.attr("data-oper");
    var $flight = $input.closest(".flight");

    $flight.find("input[id='UpdateField']").val(operation);

    $input.closest("form").submit();

}

var updateFlight = function ($intput) {

    updateFlightInput($intput);

}

var hourChanged = function (evt) {

    var charCode = (evt.which) ? evt.which : event.keyCode
    var char = String.fromCharCode(charCode);
    var value = $(this).val() + char;

    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    if (value.length == 1) {
        value = "0" + value;
    }
    if (value.length > 0 && !isNum(value) || value < "0" || value > "23") {
        return false;
    }

    return true;
}

var $flightOptions;

var displayBayChangeDialog = function () {

    var bayId = $(this).attr("data-bay-id");
    var flightId = $(this).attr("data-flight-id");

    var url = baseUrl + "Deicing/GetFlighBayUpdate";

    var data = {
        FlightId: flightId,
        BayId: bayId
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        if ($flightOptions && $flightOptions.length > 0) {
            $flightOptions.remove();
        }

        $flightOptions = $(output.SuccessResult);

        $flightOptions.dialog({
            resizable: false,
            modal: true,
            title: "Bay Update",
            height: 250,
            width: 750,
            buttons: {
                "Save": function () {

                    var input = {
                        FlightId: $("#FlightIdBayUpdate").val(),
                        LocationId: $("#FlightBayIdUpdate").val()
                    }

                    assignFlightLocation(input);

                    $(this).dialog('close');

                },
                "Cancel": function () {
                    $(this).dialog('close');
                }
            }
        });

    }

}

var openCloseBay = function () {

    var open = $(this).attr("data-oper") == "open";

    var bayId = $(this).attr("data-id");

    var url = baseUrl + "Deicing/OpenCloseBay";

    var data = {
        LocationId: bayId,
        Open: open
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        var result = $.parseJSON(output.SuccessResult);

        if (result.ErrorMessage.length > 0) {
            messageDialog("Open/Closing Bay", result.ErrorMessage);
        }
    }

}

var allowFluidsAddSubmit = function () {

    if ($(".chkFluidsToAdd:checked").length > 0) {
        $("#btnAddFluids").removeAttr("disabled");
    } else {
        $("#btnAddFluids").attr("disabled","");
    }

}

var allowDeleteFluids = function () {
    
    if ($(".chkFluidsToDelete:checked").length > 0) {
        $("#btnDeleteFluids").removeAttr("disabled");
    } else {
        $("#btnDeleteFluids").attr("disabled", "");
    }

}

var displayFlightOptions = function () {

    var flightId = $(this).attr("data-id");

    var url = baseUrl + "Deicing/GetFlightOptions";
    var data = {
        FlightId: flightId
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        if ($flightOptions && $flightOptions.length > 0) {
            $flightOptions.remove();
        }

        $flightOptions = $(output.SuccessResult);

        $flightOptions.dialog({
            resizable: false,
            modal: true,
            title: "Deicing options",
            height: 500,
            width: 650,
            buttons: {
                "Save": function () {

                    var $dialog = $(this);

                    var operation = $("#selectFlightOption").val();

                    if (operation == "FORCED_AIR" || operation == "INSPECTION") {
                        confirmDialog("Flight Operation", "The treatments for this flight will be overwritten. Are you sure you want to proceed?", function () {
                            $("#frmDialogUpdateFlightOptions").submit();
                            $dialog.dialog('close');
                        })
                    } else {

                        if ($("#frmDialogUpdateFlightOptions").find("#flightQuantities").length > 0) {

                            var quantities = getQuantitiesList();

                            var stringQuantities = "";

                            if (quantities.ErrorMessage != "") {
                                return quantities.ErrorMessage;
                                messageDialog("Flight Options", quantities.ErrorMessage);
                                return;
                            } else if (!quantities.Data || quantities.Data.length <= 0) {
                                stringQuantities = "";
                            } else {
                                stringQuantities = JSON.stringify(quantities.Data.Quantities);
                            }

                            $("#flightQuantities").val(stringQuantities);

                        }

                        $("#frmDialogUpdateFlightOptions").submit();
                        $(this).dialog('close');
                    }

                },
                "Cancel": function () {
                    $(this).dialog('close');
                }
            }
        });

        $flightOptions.find(".collapsible").each(function () {
            applyCollapsible($(this));
        });

    }

}

var refreshMagSchedulList = function (result) {

    $(result.TargetElementId).html(result.View);

    if (result.ErrorMessage) {
        messageDialog("Schedule Error", result.ErrorMessage);
        return false;
    }

}

var changeScheduleDay = function () {

    var day = $(this).val();

    var url = baseUrl + "Admin/GetDaySchedules";

    var data = {
        Day: day
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {
        $("#dvMagSchedulesList").replaceWith(output.SuccessResult);
    }

    $(".clsScheduleDay").val(day);
    $(this).val(day);

}

var editMagSchedule = function () {

    var operation = $(this).val();
    var url = baseUrl + "Admin/EditMagSchedule";
    var $button = $(this);
    var $form = $button.parents("form");
    var data;

    var mode = $button.attr("data-mode");
    data = getFormData($form);
    data["Operation"] = operation;

    if (mode) {

        if (mode == "view") {

            url = baseUrl + "Admin/ActivateEditMagSchedule";
            data = {
                ScheduleId: $form.attr("data-id"),
                Date: data["Day"]
            };

            var output = $ajaxCall(url, data, false, true)
            if (output.Successfull) {
                $form.replaceWith(output.SuccessResult);
            }

            return;
        }
    }


    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        var result = $.parseJSON(output.SuccessResult);
        $(result.TargetElementId).replaceWith(result.View);

        if (result.ErrorMessage) {
            messageDialog("MAG Schedule Error", result.ErrorMessage);
        }

    }

}

var getScheduleInformation = function () {

    var $row = $(this).parents("tr");
    var schedId = $(this).val();

    var driver = $row.find(".clsDriverLabel");
    var operator = $row.find(".clsOperatorLabel");
    var qtyType1 = $row.find(".type1Quantity");
    var qtyType4 = $row.find(".type4Quantity");

    operator.html("");
    driver.html("");
    qtyType1.val("");
    qtyType4.val("");

    var url = baseUrl + "Deicing/GetFlightQuantities";

    var data = {
        ScheduleId: schedId
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        var result = $.parseJSON(output.SuccessResult);
        driver.text(result.Driver);
        operator.text(result.Operator);

    }

}

var addFlightQuantity = function () {

    var $row = $(this).parents("tr");

    if (!isNum($row.find("select").val())) {
        return;
    }

    var $newRow = $row.clone();

    var driver = $newRow.find(".clsDriverLabel");
    var operator = $newRow.find(".clsOperatorLabel");
    var qtyType1 = $newRow.find(".type1Quantity");
    var qtyType4 = $newRow.find(".type4Quantity");
    var button = $row.find("button");
    var select = $row.find("select");

    if (!isNum(qtyType1.val()) || qtyType4.length > 0 && !isNum(qtyType4.val())) {

        messageDialog("Flight quantities", "You must provide numeric values in order to add the quantities.");

        return;
    }

    var qty1 = parseInt(qtyType1.val());
    var qty4 = 0;

    if (qtyType4.length > 0 && isNum(qtyType4.val())) {
        qty4 = parseInt(qtyType4.val());
    }

    $newRow.insertBefore($row);

    $row.removeClass("borderbottom1");
    $row.addClass("flightQuantity");

    operator.html("");
    driver.html("");
    qtyType1.val("");
    qtyType4.val("");
    button.text("Delete")
    button.removeClass("btnAddFlightQuantity")
          .addClass("btnDeleteFlightQuantity");

    select.attr("disabled", "disabled");

    //Update the total quantities
    updateDeicingQuantities(qty1, qty4, "add");

}

var updateDeicingQuantities = function (qty1, qty4, operation) {

    //Update the total quantities
    var $type1TotalQty = $("#spType1TotalQty");
    var $type4TotalQty = $("#spType4TotalQty");

    if ($type1TotalQty.length > 0) {

        var total1 = parseInt($type1TotalQty.html());

        if (operation == "add") {
            total1 = total1 + qty1;
        } else {
            total1 = total1 - qty1;
        }

        $type1TotalQty.html(total1);

    }

    if ($type4TotalQty.length > 0) {

        var total4 = parseInt($type4TotalQty.html());

        if (operation == "add") {
            total4 = total4 + qty4;
        } else {
            total4 = total4 - qty4;
        }

        $type4TotalQty.html(total4);
    }

}

var deleteFlightQuantity = function () {

    var $delRow = $(this).parents("tr");

    var qtyType1 = $delRow.find(".type1Quantity");
    var qtyType4 = $delRow.find(".type4Quantity");

    var qty1 = parseInt(qtyType1.val());
    var qty4 = 0;

    if (qtyType4.length > 0 && isNum(qtyType4.val())) {
        qty4 = parseInt(qtyType4.val());
    }

    $delRow.remove();

    updateDeicingQuantities(qty1, qty4, "delete");

}

var saveFlightQuantities = function () {

    var quantities = getQuantitiesList();

    if (quantities.ErrorMessage != "") {
        return quantities.ErrorMessage;
    } else if (!quantities.Data || quantities.Data.length <= 0) {
        return "";
    }

    var url = baseUrl + "Deicing/SaveFlightQuantities";

    var output = $ajaxCall(url, quantities.Data, false, true);

    if (output.Successfull) {

        $("#tblFlightQuantities").replaceWith(output.SuccessResult);
        return "";

    } else {

        return "An unexpected error happened while saving the flights quantities";

    }

}

var getQuantitiesList = function () {

    var output = {
        ErrorMessage : "",
        Data : undefined
    };

    var quantities = [];
    var invalid = false;
    var flightId = $("#Id").val();
    var hasQtyNotNumeric = false;
    var qty1;
    var qty4;

    if (!isNum(flightId)) {
        output.ErrorMessage = "No flight in context";
        return output;
    }

    $("tr.flightQuantity").each(function () {

        var $row = $(this);

        qty1 = $row.find(".type1Quantity");
        qty4 = $row.find(".type4Quantity");

        if (qty1.length > 0) {
            qty1 = qty1.val().trim()
            hasQtyNotNumeric = qty1 != "" && !isNum(qty1);
        } else {
            qty1 = "";
        }

        if (qty4.length > 0) {
            qty4 = qty4.val().trim()
            hasQtyNotNumeric = hasQtyNotNumeric || qty4 != "" && !isNum(qty4);
        } else {
            qty4 = "";
        }

        if (hasQtyNotNumeric) {
            return false;
        }

        quantities.push({
            Id: $row.attr("data-id"),
            QtyScheduleId: $row.find("select").val(),
            Type1Quantity: qty1,
            Type4Quantity: qty4
        });

    });

    if (hasQtyNotNumeric) {
        output.ErrorMessage = "The quantities entered must be numeric values.";
        return output;
    }

    if (quantities.length <= 0) {
        output.ErrorMessage = "";//"You must add quantities in order to save the flight.";
        return output;
    }

    var data = {
        FlightId: flightId,
        Quantities: quantities
    };

    output.Data = data;
    return output;

}

var activateDeicingEdit = function () {

    var oper = $(this).attr("data-oper");
    var $button = $(this);

    var $inputs = $(this).closest(".dvDeicingConditions").find("input");
    var $selects = $(this).closest(".dvDeicingConditions").find("select");

    if (oper == "edit") {

        $inputs.removeAttr("disabled");
        $selects.removeAttr("disabled");
        $button.attr("data-oper", "cancel");
        $button.text("Cancel");

    } else {

        $inputs.attr("disabled", "disabled");
        $selects.attr("disabled", "disabled");
        $button.attr("data-oper", "edit");
        $button.text("Edit");

        //Restaure original values

    }

}

var displayFlightInSlipEvent = function () {

    var $row = $(this);

    if ($(".edit").length > 0) {
        confirmDialog("Flight Edit", "If you proceed, the changes done will be lost. Are you sure you want to proceed?", displayFlightInSlip, $row);
    } else {
        displayFlightInSlip($row);
    }

}

var closeFlightEditDialog = function () {

    if ($flightEditDialog) {
        $flightEditDialog.dialog('close');
    }

}

var displayFlightInSlip = function ($row) {

    if (!$row) {
        $row = $(this);
    }

    if ($row.hasClass("selected")) {
        return;
    }

    var isAdmin = $("#dvSlipFlights").attr("data-admin");

    var flightId = $row.attr("data-id");

    var data = {
        FlightId: flightId,
        IsSlipAdmin: isAdmin
    };

    var url = baseUrl + "Admin/GetFlightSlipData";

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        var result = $.parseJSON(output.SuccessResult);

        $("#Id").val(result.Id);
        $("#StatutDAvancement").val(result.StatutDAvancement);

        $("#dvSlipFlights").html(result.HtmlWeekFlightsList);

        $("#flightDetails").html(result.HtmlFlightDetails);
        $("#dvConditions").html(result.HtmlFlightConditions);
        $("#dvFlightOperations").html(result.HtmlFlightOperations);
        $("#tblFlightQuantities").replaceWith(result.HtmlFlightQuantities);
        $("#flightSlipButtonCommands").html(result.HtmlFlightSlipButtons);

        $(".selected").removeClass("selected");
        $(".edit").removeClass("edit");
        $row.addClass("selected");

        $(".validation-summary-errors li").remove();

    }

}

var editFlight = function ($row, enableOnly) {

    if (!enableOnly) {
        displayFlightInSlip($row);
    }

    $("#dvFlightSlip").find("[disabled='disabled']").each(function () {
        if (!$(this).hasClass("alwaysDisable")) {
            $(this).removeAttr("disabled");
        }
    });

    $(".selected").removeClass("selected");
    $row.addClass("selected");
    $(".edit").removeClass("edit");
    $row.addClass("edit");

}

var deleteCarrierEmail = function () {

    var emailId = $(this).attr("data-emailid");
    var email = $(this).attr("data-email");
    var $row = $(this).parents("tr");

    confirmDialog("Delete Email", "Are you sure you want to delete the email " + email + "?", function (emailId) {

        var url = baseUrl + "Admin/DeleteAirlineEmail";

        var data = {
            EmailId: emailId
        };

        var output = $ajaxCall(url, data, false, true);

        if (output.Successfull) {
            $row.remove();
        }

    }, emailId);

}

var CurrentFlightId;

var displayNEditFlightInSlip = function () {

    var $row = $(this);

    CurrentFlightId = $row.attr("data-id");

    if ($row.hasClass("edit")) {
        return;
    };

    if ($(".edit").length > 0) {
        confirmDialog("Flight Edit", "If you proceed, the changes done will be lost. Are you sure you want to proceed?", editFlight, $row);
    } else {
        editFlight($row);
    }

}

var getServerTime = function () {

    var $input = $(this);

    if ($input.val().length > 0) {
        return;
    }

    var url = baseUrl + "Admin/GetAirportTimeOnlyLabel";

    var output = $ajaxCall(url, undefined, false, true);

    if (output.Successfull) {
        $input.val(output.SuccessResult);
    }

}

var setSelectTruckMagSchedule = function (flightId, isInEdit) {

    var data = {
        FlightId: flightId,
        IsInEdit: isInEdit
    };

    var url = baseUrl + "Admin/GetHtmlSelectTruckMagSchedule";

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        $("#tdSelectTruckMagSchedule").html(output.SuccessResult);

    }

}

var slipWeekChange = function () {

    var date = $("#Week").val();
    var statusCd = $("#SlipAdminSearchStatus").val();
    var isSlipAdmin = $("#IsSlipAdmin").val();

    var data = {
        FirstDayOfWeek: date,
        IsSlipPageAdmin: isSlipAdmin,
        StatusCd: statusCd
    };

    var url = baseUrl + "Admin/GetWeekFlightsSlip";

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        var result = $.parseJSON(output.SuccessResult);

        $("#dvSlipFlights").html(result.HtmlWeekFlightsList);

        $("#flightDetails").html(result.HtmlFlightDetails);
        $("#dvConditions").html(result.HtmlFlightConditions);

        $("#dvFlightOperations").html(result.HtmlFlightOperations);
        $("#dvFlightQuantities").html(result.HtmlFlightQuantities);

        if ($(".btnPrintSlip").length > 0) {
            var slipUrl = $("#confirmationSlipUrl").val() + result.FlightSlipNo;
            $(".btnPrintSlip").attr("href", slipUrl);
        }

    }

}

var saveSlipFlight = function () {

    var oper = $(this).attr("data-op");
    $("#SubmitOperation").val(oper);

    //Save the quantities
    var errorMsg = saveFlightQuantities();

    if (errorMsg.length > 0) {
        messageDialog("Flight quantities", errorMsg);
        return false;
    } else {
        return true;
    }

}

var $magScheduleDialog;

var displayMagSchedule = function () {

    var day = $(this).attr('data-day');

    var flightId = $(this).attr('data-flight-id');
    var isInEdit = false;

    if (!($("#NewScheduleId").attr("disabled"))) {
        isInEdit = true;
    }

    if (flightId) {
        CurrentFlightId = flightId;
    } else {
        CurrentFlightId = -1;
    }

    if ($magScheduleDialog) {
        $magScheduleDialog.remove();
    }

    var url = baseUrl + "Admin/GetMagSchedule";
    var data = {
        ScheduleDay: day
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        $magScheduleDialog = $(output.SuccessResult);

        $magScheduleDialog.dialog({
            resizable: false,
            modal: true,
            title: "Mag Schedule",
            height: 500,
            width: 900,
            buttons: {
                "Close": function () {
                    $(this).dialog('close');
                    if (CurrentFlightId > 0) {
                        setSelectTruckMagSchedule(CurrentFlightId, isInEdit);
                    }
                }
            }
        });

    }

}

var $displayDeicingConditions;

var displayDeicingConditions = function () {

    if ($displayDeicingConditions) {
        $displayDeicingConditions.remove();
    }

    var url = baseUrl + "Admin/GetDeicingConditions";

    var output = $ajaxCall(url, undefined, false, true);

    if (output.Successfull) {

        $displayDeicingConditions = $(output.SuccessResult);

        $displayDeicingConditions.dialog({
            resizable: false,
            modal: true,
            title: "Deicing Conditions",
            height: 247,
            width: 640,
            buttons: {
                "Close": function () {
                    $(this).dialog('close');
                }
            }
        });
    }

}

var selectCurrentFlightInEdit = function (flightId) {

    var $row = $("tr.selectFlightSlip[data-id='" + flightId + "'");

    if ($row.length > 0) {
        editFlight($row, true);
    }

}

var poolingTimeRefreshRoutine = function () {

    if ($(".currentTimeLabel").length > 0) {

        var url = baseUrl + "Admin/GetAirportTimeLabel";

        var output = $ajaxCall(url, undefined, false, true);

        if (output.Successfull) {
            if (output.SuccessResult.length < 20) {
                $(".currentTimeLabel").text(output.SuccessResult);
            }

        };

    }

}

var poolingFlightRefreshRoutine = function () {

    if ($("#tdFlightsInProgress").length > 0) {

        var url = baseUrl + "Deicing/GetDeicingFlights";

        var output = $ajaxCall(url, undefined, false, true);

        if (output.Successfull) {

            var result = $.parseJSON(output.SuccessResult);

            if (!stopColdStorageFlightsRefresh) {
                $("#tdFlightsInColdStorage").html(result.HtmlFlightsInColdStorage);
            }

            if (!stopFlightsRefresh) {
                $("#tdFlightsInProgress").html(result.HtmlFlightsInProcess);
            }

            $("#dvDeicingConditions").html(result.HtmlDeicingConditions);

            // applyCollapsible();
        };

    } else if ($("#dvFlightsListView").length > 0) {

        var url = baseUrl + "Airline/GetDeicingFlightsView";

        var output = $ajaxCall(url, undefined, false, true);

        if (output.Successfull) {

            var result = $.parseJSON(output.SuccessResult);

            $("#dvFlightsListView").html(result.HtmlFlightsView);
            $("#dvDeicingConditions").html(result.HtmlDeicingConditions);
            $("#dvColdStorageView").html(result.HtmlColdStorageView);

        };

    }

}

var timeRefreshRoutine;
var flightsRefreshRouting;

var setTimers = function () {

    timeRefreshRoutine = setInterval(poolingTimeRefreshRoutine, 1000);
    flightsRefreshRouting = setInterval(poolingFlightRefreshRoutine, 2000);

}

var stopColdStorageFlightsRefresh = false;
var stopColdStorageRefresh = function () {
    stopColdStorageFlightsRefresh = true;
    stopFlightsRefresh = true;
}

var stopFlightsRefresh = false;
var stopAutoRefresh = function () {
    stopFlightsRefresh = true;
    console.log("Enter Edit");
}

var updateAndResumeAutoRefresh = function () {

    stopFlightsRefresh = false;
    var $intput = $(this);

    updateFlight($intput);
    console.log("Exit Edit");

}

var updateAndResumeColdStorageRefresh = function () {
    stopColdStorageFlightsRefresh = false;
    stopFlightsRefresh = false;
}

var updateFlightOperation = function () {
    stopFlightsRefresh = true;
    var $btn = $(this);
    updateFlight($btn);
}

var $flightEditDialog;

var displayNEditFlight = function () {

    if ($flightEditDialog) {
        $flightEditDialog.remove();
    }

    var callFromColdStorage = $(this).hasClass("flightColdStorage");
    var callFromTaxiway = $(this).hasClass("flightTaxiway");

    var flightId = $(this).attr("data-id");
    var url = baseUrl + "Deicing/GetFlightEditDialog";

    var data = {
        FlightId: flightId,
        CallFromColdStorage: callFromColdStorage,
        CallFromTaxiway: callFromTaxiway
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        $flightEditDialog = $(output.SuccessResult);

        $flightEditDialog.dialog({
            resizable: false,
            modal: true,
            title: "Edit Flight",
            height: 400,
            width: 460,
            buttons: {
                "Close": function () {
                    $(this).dialog('close');
                    $flightEditDialog.remove();
                }
            },
            dialogClass: "clsEditFlightDialog"
        });

    };

}

var $airlineSummaryDialog;

var displayAirlineSummary = function () {

    if ($airlineSummaryDialog) {
        $airlineSummaryDialog.remove();
    }

    var url = baseUrl + "Reports/AirlinesSummaryDialog";

    var data = null;

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        $airlineSummaryDialog = $(output.SuccessResult);
        var title = $airlineSummaryDialog.find("#reportTitle").val();

        $airlineSummaryDialog.dialog({
            resizable: true,
            modal: true,
            title: title,
            height: 700,
            width: 900,
            buttons: {
                "Close": function () {
                    $(this).dialog('close');
                    $airlineSummaryDialog.remove();
                }
            },
            dialogClass: "clsConfirmationSlipDialog"
        });

    };

}



var displayConfirmationSlipDialog = function () {

    var $btn = $(this);

    var slipNo = $(this).attr("data-slipno");
    var showParametersArea = $(this).attr("data-show-params");

    var url = baseUrl + "Reports/ConfirmationSlipDialog";

    var data = {
        SlipNo: slipNo,
        ShowParametersArea: showParametersArea
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        var $dialog = $(output.SuccessResult);

        $dialog.dialog({
            resizable: true,
            modal: true,
            title: "Slip #" + slipNo,
            height: 700,
            width: 900,
            buttons: {
                "Close": function () {
                    $(this).dialog('close');
                    $dialog.remove();
                }
            }
        });

    };

}



var displayConfirmationSlip = function () {

    var $btn = $(this);

    if ($btn.hasClass("reportLoaded")) {
        return;
    }

    var slipNo = $(this).attr("data-slipno");
    var showParametersArea = $(this).attr("data-show-params");

    var url = baseUrl + "Reports/ConfirmationSlipView";

    var data = {
        SlipNo: slipNo,
        ShowParametersArea: showParametersArea
    };

    var output = $ajaxCall(url, data, false, true);

    if (output.Successfull) {

        $btn.addClass("reportLoaded");
        $("#tdConfirmationSlip").html(output.SuccessResult);

    };

}

var refreshFluidsView = function () {
    applyCollapsible($("#dvListFluidsToAdd"));
}

var fnNavigateToItem = function () {

    var url = $(this).attr("data-nav-url");

    if (url && url.length > 0) {
        if (window.location.href.toLowerCase().includes("aeromag2000.com:2040")) {
            if(!url.toLowerCase().includes("aeromag2000.com:2040")){
                url = url.replace("aeromag2000.com", "aeromag2000.com:2040");
            }
        }
        window.location = url;
    }

}

var displayEI11Warning = function () {

    var $spIE11Warning = $("#spIE11Warning");
    var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

    if (isIE11 && $spIE11Warning.length > 0) {
        $spIE11Warning.html("If you are using Internet Explorer 11 and having issues with displaying the report, please press Alt and click in the Tools menu and Compatibility option. Click add to add the current website.");
    }
}

$(document).ready(function () {

    $(document).tooltip();
    $(".menu").menu();

    $(document).on('blur', '.uCase', capitalizeInput);

    $(document).on('blur', '.setCarrier', setDefaultCarrier);
    
    $(document).on('change', '.clsDay', changeScheduleDay);

    $(document).on('focusin', '.time', getStationCurrentTime);
    $(document).on('click', '.btnUpdateFlight', updateFlightOperation);
    $(document).on('click', '.clsEditSchedule', editMagSchedule);
    $(document).on('click', '.clsFlightOptions', displayFlightOptions);
    $(document).on('click', '.btnAddFlightQuantity', addFlightQuantity);
    $(document).on('change', '.clsDpdnLocation', assignFlightToLocation);
    $(document).on('focus', '.clsDpdnLocation', stopColdStorageRefresh);

    $(document).on('click', '.btnDeleteFlightQuantity', deleteFlightQuantity);
    $(document).on('change', '.selectQuantitySchedule', getScheduleInformation);

    $(document).on('click', '.btnSaveQuantities', saveFlightQuantities);

    $(document).on('click', '.editDeicingConditions', activateDeicingEdit);
    $(document).on('click', '.selectFlightSlip', displayFlightInSlipEvent);
    $(document).on('dblclick', '.selectFlightSlip', displayNEditFlightInSlip);
    $(document).on('change', '.slipWeek', slipWeekChange);
    $(document).on('click', '.saveSlipFlight', saveSlipFlight);
    $(document).on('click', '.btnMagSchedule', displayMagSchedule);
    $(document).on('click', '.btnDeicingConditions', displayDeicingConditions);
    $(document).on('focus', '.updateFlight', stopAutoRefresh);
    $(document).on('blur', '.updateFlight', updateAndResumeAutoRefresh);

    $(document).on('blur', '.clsDpdnLocation', updateAndResumeColdStorageRefresh);

    $(document).on('click', '.btnListFlightSlip', slipWeekChange);

    $(document).on('dblclick', '.flightColdStorage,.flightTaxiway', displayNEditFlight);

    $(document).on('click', '#btnPrintSlip', displayConfirmationSlip);

    $(document).on('click', '#btnPrintSlipDialog', displayConfirmationSlipDialog);

    $(document).on('click', '#btnPrintAirlineSummary', displayAirlineSummary);

    $(document).on('click', '.selectable', fnNavigateToItem);

    $(document).on('focus', '.serverTime', getServerTime);

    $(document).on('click', '.btnDeleteEmail', deleteCarrierEmail);

    $(document).on('click', '#btnDeleteFlight', fnValidateFlightOperation);

    $(document).on('click', '.bayHeader', displayBayChangeDialog);

    $(document).on('click', '.btnOpenCloseBay', openCloseBay);

    $(document).on('change', '.chkFluidsToAdd', allowFluidsAddSubmit)

    $(document).on('change', '.chkFluidsToDelete', allowDeleteFluids)
    
    displayEI11Warning();

    setTimers();

    $(".time").attr("maxlenght", "8");

});

