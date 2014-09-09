// singleton
var FIXParser = (function() {
    "use strict";

    var clientOrderLookup = {};

    function splitKeyVals(text, delimiter) {
        var result = {};

        text.split(delimiter).map(function(pair) {
            var keyAndValue = pair.split('=');
            if (keyAndValue[0] !== '') {
                result[keyAndValue[0]] = keyAndValue[1];
            }
        });

        return result;
    }

    function decorateFIX(message) {
        var result = {};

        // lookup tag names, translate to human readable version
        _.map(message, function(value, key) {
            var tag = tagLU[key],
                desc = tag && tag.desc;

            if (tag && desc) {
                // lookup in enum, if not present go with literal
                result[desc] = tag.enum[value] || value;
            }
        });

        var clientOrderId = result.ClOrdID;

        // store message in lookup table
        if (clientOrderId) {
            clientOrderLookup[clientOrderId] = clientOrderLookup[clientOrderId] || result;
        }

        result.MsgDetail = getMessageDetail(result);

        return result;
    }


    function getMessageDetail(result) {

        function findByOrderId(orderId) {
            return clientOrderLookup[orderId];
        }

        var detailFn, dispatch = {
            EXECUTION_REPORT: function() {
                var originalRequest = findByOrderId(result.OrigClOrdID),
                    detail = {},
                    _qty,
                    _cumQty;

                if (originalRequest) {
                    _qty = parseFloat(result.OrderQty);
                    _cumQty = parseFloat(result.CumQty);

                    if (_qty && _cumQty) {
                        detail.percentComplete = 100 * _cumQty / _qty;
                    }
                }

                return detail;
            },
            REJECT: function() {
                // Text should contain a reason for the rejection
                return {
                    text: result['Text'] || ''
                };
            },
            ORDER_CANCEL_REQUEST: function() {
                var originalRequest = findByOrderId(result.OrigClOrdID);

                return {
                    OriginalPrice: originalRequest.Price
                };
            },
        };

        detailFn = dispatch[result.MsgType];
        return detailFn ? detailFn(result) : null;
    }

    return {
        // private, here for testing
        splitKeyVals: splitKeyVals,
        extractMessages: function(fixText) {

            if (fixText.length === 0) {
                throw "No text found, please paste well formed FIX messages or click 'Sample data'";
            }

            var messages = fixText.match(/[^0-9a-zA-Z:\s]*8=FIX(.*?)[^0-9]10=\d\d\d.?/g);
            if (messages === null) {
                throw "No well formed FIX string found";
            }

            return messages;
        },
        guessDelimiter: function (fixText) {
            //Find end of tag 9 and beginning of tag 35. A char or set of cars between these two fields is the delim
            //--match tag 9 and find its length
            //--search tag 9, find its and location
            //--search tag 35 find its start location
            //--characters between end of tag 9 and start of tag 35 are the delimiter
            var tag9keyval = fixText.match(/[^0-9]9=[0-9]+/)[0];
            var startOfTag9 = fixText.search(/[^0-9]9=[0-9]+/);
            var endOfTag9 = startOfTag9 + tag9keyval.length;
            var startOfTag35 = fixText.search(/[^0-9]35=/) + 1;
            var delim = fixText.slice(endOfTag9, startOfTag35);

            return delim;

            //delimLoc = fixText.search(/[^0-9]9=/g);//TODO: does the 'g' need to be there?
            //return fixText[delimLoc];
        },
        toJSON: function(message, delimiter) {
            delimiter = delimiter || this.guessDelimiter(message);

            return decorateFIX(splitKeyVals(message, delimiter));
        }
    };

}());