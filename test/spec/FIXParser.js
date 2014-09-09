describe('FIXParser', function() {

    it('should guess a delimiter from a given message', function () {
        var config = {
            "8=FIX.4.19=6135=61": "",
            "8=FIX.4.1|9=61|35=44": "|",
            "8=FIX.4.1^A9=61^A35=44": "^A",
            "8=FIX.4.19=6135=6110=9998=FIX.4.19=6135=6110=999": ""
        };

        _.map(config, function (value, key) {
            var delimiter = FIXParser.guessDelimiter(key);
            expect(delimiter).toBe(value);
        });
    });


    it('should split the FIX string into key/value pairs', function () {
        var rawMessage = FIXParser.splitKeyVals("8=FIX.4.19=6135=61","");

        expect(rawMessage["8"]).toBe("FIX.4.1");
        expect(rawMessage["9"]).toBe("61");
        expect(rawMessage["35"]).toBe("61");

        expect(_.keys(rawMessage).length).toBe(3);
    });


    it('should extract raw messages from input string', function () {
        var input = "8=FIX.4.1,9=61,35=321,10=999,",
            messages = FIXParser.extractMessages(input);

        expect(messages.length).toBe(1);

        messages = FIXParser.extractMessages("hello" + input + "hello" + input + "hello");
        expect(messages.length).toBe(2);
    });

});