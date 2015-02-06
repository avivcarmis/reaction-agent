ScrollAgent.events();
var navScrollAgent = new ScrollAgent(), affixScrollAgent = new ScrollAgent();
$(document).on("scrolldown", function() {
        $("header").addClass("scroll-down");
});
$(document).on("scrollup", function() {
        $("header").removeClass("scroll-down");
});
navScrollAgent.add(0, function() {
        $("body").removeClass("scroll");
});
navScrollAgent.add(200, function() {
        $("body").addClass("scroll");
});

$(function() {
        $(".anchor").each(function(i) {
                var elementId = $(this).attr("id");
                affixScrollAgent.add(this, function() {
                        $(".sidenav li.active").removeClass("active");
                        $(".sidenav a[href='#" + elementId + "']").parent().addClass("active");
                }, -10);
        });
});

/*
$(document).on('click', 'a', function() {
        if ($(this).attr("href").charAt(0) == "#") {
                var currentScroll = $(window).scrollTop();
                window.location.hash = $(this).attr("href");
                $(window).scrollTop(currentScroll);
                var top = $(window.location.hash).offset().top;
                $("html, body").animate({scrollTop: (top - 100) + "px"}, 800);
        }
});
*/

$(function() {
        $('code:not(.inline)').each(function() {
                hljs.highlightBlock(this);
        });
        $('.sidenav').each(function() {
                var element = $(this);
                var parent = element.parent();
                var toBottom;
                var getElementTop = function() {
                        return parent.offset().top + parseFloat(parent.css("padding-top"));
                };
                var getElementBottom = function() {
                        return getElementTop() + element.getHeight(1,1);
                };
                var setState = function() {
                        if ($("header").height() + element.getHeight(1,1) > $(window).height()) {
                                element.addClass("to-bottom");
                                toBottom = true;
                        }
                        else {
                                element.removeClass("to-bottom");
                                toBottom = false;
                        }
                };
                responsiveBind(setState, true);
                var updateAffix = function() {
                        if (toBottom) {
                                if ($(window).scrollTop() + $(window).height() >= getElementBottom()) {
                                        if ($(window).scrollTop() + $(window).height() >= $("footer").offset().top - parseFloat($("footer").css("margin-top"))) {
                                                element.css("top", ($(document).height() - $("footer").getHeight(1,1,1) - $(".sidenav").getHeight(1,1) - $("header").height()) + "px");
                                                element.removeClass("affix affix-top").addClass("affix-bottom");
                                        }
                                        else {
                                                element.css("top", "").height();
                                                element.removeClass("affix-bottom affix-top").addClass("affix");
                                        }
                                }
                                else {
                                        element.css("top", "").height();
                                        element.removeClass("affix-bottom affix").addClass("affix-top");
                                }
                        }
                        else {
                                if ($(window).scrollTop() + $("header").height() >= getElementTop()) {
                                        if (element.getHeight(1,1) + parseFloat($("footer").css("margin-top")) >= $("footer").offset().top - $(window).scrollTop() - $("header").height()) {
                                                element.css("top", ($(document).height() - $("footer").getHeight(1,1,1) - $(".sidenav").getHeight(1,1) - $("header").height()) + "px");
                                                element.removeClass("affix affix-top").addClass("affix-bottom");
                                        }
                                        else {
                                                element.css("top", "").height();
                                                element.removeClass("affix-bottom affix-top").addClass("affix");
                                        }
                                }
                                else {
                                        element.css("top", "").height();
                                        element.removeClass("affix-bottom affix").addClass("affix-top");
                                }
                        }
                };
                responsiveBind(updateAffix, true);
                $(window).scroll(updateAffix);
        });
});