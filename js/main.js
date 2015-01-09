ScrollAgent.activateEvents();
ScrollAgent.add(0, function() {
        $("body").removeClass("scroll");
});
ScrollAgent.add(200, function() {
        $("body").addClass("scroll");
});
$(document).on("scrolldown", function() {
        $("header").addClass("scroll-down");
});
$(document).on("scrollup", function() {
        $("header").removeClass("scroll-down");
});