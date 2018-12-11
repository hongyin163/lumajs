describe("hello world!", function () {
    it("hello module", function () {
        require(['hello'], function (hello) {
            console.log(hello);
            expect('helloa').toEqual(hello.say());
        });       
    })
});
