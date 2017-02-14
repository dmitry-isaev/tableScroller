/**
 * Плагин для добавления плавающего заголовка и скрола к таблицам
 */
(function($) {
    "use strict";

    var defaults = {
        // Инициализация компонентов (all - все, scroll - скрол, head - заголовок)
        init: "all",
        // Задержка перед инициализацией скрола
        initScrollTimeout: 500,
        // Ширина для таблицы
        tableWidth: "100%",
        // Ширина для блока-обертки таблицы
        tableWrapperWidth: "100%",
        // Внешние отступы для блока-обертки таблицы
        tableWrapperMargin: "0px"
    };

    // Первоначальное позиционирование первого скрола на странице
    var firstScrollOffsetTop = 0;

    var methods = {
        init: function(options) {
            options = $.extend(defaults, options || {});

            return this.each(function(i) {
                var $this = $(this),
                    tableScroller = new TableScroller($this, options);

                if (i == 0) firstScrollOffsetTop = tableScroller.tableWrapper.offset().top;

                if (options.init == "scroll") {
                    tableScroller.initScroll();
                } else if (options.init == "head") {
                    tableScroller.initHead();
                } else {
                    tableScroller.initAll();
                }
            });
        }
    };

    /**
     * Конструктор
     */
    function TableScroller($this, options) {
        if ($this.parent(".scroller").length == 0) {
            var wrapper = $("<div/>", {
                "class": "scroller",
                "style": "width: " + options.tableWrapperWidth + ";" +
                         "margin: " + options.tableWrapperMargin + ";"
            });

            $this.css({
                "margin": "0",
                "position": "relative",
                "width": options.tableWidth
            }).wrap(wrapper);
        }

        // Текущая таблица
        this.tableObject = $this;
        // Блок-обертка для таблицы
        this.tableWrapper = $this.parent(".scroller");
        // Высота таблицы
        this.tableHeight = this.tableWrapper.height();
        // Высота заголовка таблицы
        this.tableHeadHeight = "";
        // Смещение начала таблицы относительно начала документа
        this.tableOffsetTop = this.tableWrapper.offset().top;
        // Смещение окончания таблицы относительно начала документа
        this.tableOffsetBottom = this.tableOffsetTop + this.tableHeight;
        // Изначальное позиционирование скрола
        this.primaryScrollPosition = 0;
        // Расчет нового позиционирования скрола
        this.calculateScrollPosition = 0;
        // Изначальное позиционирование заголовка таблицы
        this.primaryTableHeadPosition = 0;
        // Расчет нового позиционирования заголовка таблицы
        this.calculateTableHeadPosition = 0;
        // Информация об инициализированном скроле
        this.niceScroll = "";
        // Текущий скрол
        this.scrollObject = "";
        // Расстояние от верхней линии окна
        this.documentTopScroll = $(document).scrollTop();
        // Расстояние от нижней линии окна
        this.documentBottomScroll = $(window).height() + $(document).scrollTop();
        // Опции
        this.options = options;

        return this;
    }

    /**
     * Инициализация скрола
     */
    TableScroller.prototype.initScroll = function() {
        var $this = this,
            scrollHeight;

        $this.niceScroll = $this.tableWrapper.niceScroll({
            autohidemode: false,
            horizrailenabled: true
        });

        $this.scrollObject = $("#" + $this.niceScroll.id + "-hr");

        scrollHeight = $this.scrollObject.outerHeight(true);

        $this.primaryScrollPosition = $this.scrollObject.position().top;

        var calculateScroll = function() {
            $this.documentBottomScroll = $(window).height() + $(document).scrollTop();
            $this.calculateScrollPosition = $this.documentBottomScroll - (firstScrollOffsetTop + scrollHeight);

            if ($this.documentBottomScroll < $this.tableOffsetBottom && $this.documentBottomScroll > $this.tableOffsetTop) {
                $this.scrollObject.css({position: "absolute", top: $this.calculateScrollPosition + "px"});
            } else {
                $this.scrollObject.css({position: "absolute", top: $this.primaryScrollPosition + "px"});
            }
        };

        setTimeout(function() {
            calculateScroll();
        }, $this.options.initScrollTimeout);

        $(window).resize(function() {
            calculateScroll();
        });

        $(document).scroll(function() {
            calculateScroll();
        });
    };

    /**
     * Инициализация заголовка
     */
    TableScroller.prototype.initHead = function() {
        var $this = this;

        $this.cloneHead();

        $this.tableHeadHeight = $this.tableObject.find("thead.cloned").outerHeight(true);

        $(document).scroll(function() {
            $this.documentTopScroll = $(document).scrollTop();
            $this.calculateTableHeadPosition = $this.documentTopScroll - $this.tableOffsetTop;

            if ($this.documentTopScroll > $this.tableOffsetTop && $this.documentTopScroll + $this.tableHeadHeight < $this.tableOffsetBottom) {
                $this.tableWrapper.find("thead.cloned").show().css({"top": $this.calculateTableHeadPosition + "px"});
            } else {
                $this.tableWrapper.find("thead.cloned").hide().css({"top": $this.primaryTableHeadPosition + "px"});
            }
        });

        $(window).resize(function() {
            $this.tableObject.find("thead.cloned").remove();
            $this.cloneHead();
        });
    };

    /**
     * Инициализация заголовка и скрола
     */
    TableScroller.prototype.initAll = function() {
        this.initScroll();
        this.initHead();
    };

    /**
     * Клонирование заголовка
     */
    TableScroller.prototype.cloneHead = function() {
        var $this = this,
            trList = [],
            headObject;

        $this.tableObject.find("thead tr").each(function() {
            var $tr = $(this),
                tdList = [],
                trObject = $("<tr/>");

            $tr.find("th, td").each(function() {
                var $td = $(this),
                    tdObject = $("<" + $td.get(0).tagName.toLowerCase() + "/>", {
                    "style": "width: " + $td.width() + "px",
                    "colspan": $td.attr("colspan"),
                    "text": $td.html()
                });

                tdList.push(tdObject);
            });

            trObject.append(tdList);

            trList.push(trObject);
        });

        headObject = $("<thead/>", {
            "class": "cloned",
            "style": "display: none; position: absolute; left: 0; top: 0"
        }).append(trList);

        $this.tableObject.append(headObject);
    };

    /**
     * Инициализация плагина
     */
    $.fn.tableScroller = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("Метод с именем " + method + " не существует для $.fn.tableScroller");
        }
    };
})(jQuery);