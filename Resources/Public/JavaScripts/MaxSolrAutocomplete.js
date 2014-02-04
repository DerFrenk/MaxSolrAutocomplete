var tx_solr_suggestUrl = tx_solr_suggestUrl || "";

jQuery(document).ready(function ($) {
    'use strict';

    var SolrAutocomplete = {

        getData: function (searchterm, language, callbackFunction) {
            $.getJSON(
                tx_solr_suggestUrl,
                {
                    termLowercase: searchterm.toLowerCase(),
                    termOriginal: searchterm,
                    L: language
                },
                function (data) {
                    var output = [];

                    $.each(data, function (term, termIndex) {
                        var unformatted_label = term;
                        output.push({
                            label: unformatted_label.replace(new RegExp('(?![^&;]+;)(?!<[^<>]*)(' +
                                searchterm.replace(/[\-\[\]{}()*+?.,\^$|#\s]/g, "\\$&") +
                                ')(?![^<>]*>)(?![^&;]+;)', 'gi'), '<strong>$1</strong>'),
                            value: term
                        });
                    });

                    callbackFunction(output);
                }
            );
        },

        showDropdown: function (inputElement, data) {

            if (!data || data.length === 0) {
                return;
            }

            var self = this,
                list = $('<ul class="solrAutocomplete"></ul>'),
                listItem,
                label;

            // Remove every possible previous dropdown
            self.removeDropdown();

            // Add event listeners for the recent created list
            list.on('click.MaxSolrAutocomplete.itemClick', '.solrAutocomplete-item', function () {
                // Fill the parent with the clicked value, submit the form and remove the dropdown
                inputElement.val($(this).data('value'));
                inputElement.parents('form').first().trigger('submit');
                self.removeDropdown();
            });

            list.on('mouseover.MaxSolrAutocomplete.itemHover', '.solrAutocomplete-item', function () {
                list.children().removeClass('is-active');
                $(this).addClass('is-active');
            });

            $.each(data, function (index, row) {
                label = $('<span class="solrAutocomplete-item-label"></span>').append(row.label);
                listItem = $('<li class="solrAutocomplete-item"></li>').data('value', row.value);
                list.data('inputElement', inputElement);

                listItem.append(label);
                list.append(listItem);
            });

            // Reposition the dropdown after each window resize
            $(window).off('resize.MaxSolrAutocomplete').on('resize.MaxSolrAutocomplete', function () {
                self.positionDropdown(list, inputElement);
            });

            // Put the list on the right position and append it to the body
            self.positionDropdown(list, inputElement);
            $('body').append(list);
        },

        positionDropdown: function (dropdown, relativeTo) {
            dropdown.css({
                top: (relativeTo.offset().top + relativeTo.outerHeight()),
                left: relativeTo.offset().left,
                width: relativeTo.outerWidth()
            });
        },

        selectNextDropdownItem: function () {
            var currentlySelectedItem = $('.solrAutocomplete .solrAutocomplete-item.is-active'),
                nextItem = null;

            if (currentlySelectedItem.length === 0 || $('.solrAutocomplete .solrAutocomplete-item').last().is(currentlySelectedItem)) {
                nextItem = $('.solrAutocomplete .solrAutocomplete-item').first();
            } else {
                nextItem = currentlySelectedItem.next();
            }

            this.focusDropdownItem(nextItem);
        },

        selectPreviousDropdownItem: function () {
            var currentlySelectedItem = $('.solrAutocomplete .solrAutocomplete-item.is-active'),
                prevItem = null;

            if (currentlySelectedItem.length === 0 || $('.solrAutocomplete .solrAutocomplete-item').first().is(currentlySelectedItem)) {
                prevItem = $('.solrAutocomplete .solrAutocomplete-item').last();
            } else {
                prevItem = currentlySelectedItem.prev();
            }

            this.focusDropdownItem(prevItem);
        },

        focusDropdownItem: function (item) {
            $('.solrAutocomplete .solrAutocomplete-item.is-active').removeClass('is-active');
            item.addClass('is-active');

            $($('.solrAutocomplete').data('inputElement')).val(item.data('value'));

        },

        removeDropdown: function () {
            $('.solrAutocomplete').remove();
        }
    };


    // ONLOAD CODE

    $(document).on('MaxSolrAutocomplete.RemoveDropdown', function () {
        SolrAutocomplete.removeDropdown();
    });

    $('.tx-solr-q').addClass('autocomplete-inputField').attr('autocomplete', 'off');

    $('.autocomplete-inputField').each(function () {
        var field = $(this),
            timeoutId = null,
            previousValue = field.val();

        field.on('keyup.MaxSolrAutocomplete.dataSuggest', function (event) {
            // 38 = KEY UP, 40 = KEY DOWN
            if (event.keyCode !== 38 && event.keyCode !== 40) {

                // Only continue if the field value has been changed (and not, F.E., the PAGEUP-key has been pushed)
                if (field.val() === previousValue) {
                    return;
                }

                previousValue = field.val();

                // If a timeout is set, clear it and set a new one later
                if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                    timeoutId = null;
                }

                // Not enough data has been filled in, so make sure there's no dropdown and stop the execution of this function
                if (field.val().length < 3) {
                    SolrAutocomplete.removeDropdown();
                    return;
                }

                // Set a delay and get the data after the timeout has passed
                timeoutId = window.setTimeout(function () {
                    SolrAutocomplete.getData(field.val(), $('.tx-solr input[name="L"]').val(), function (data) {
                        SolrAutocomplete.showDropdown(field, data);
                    });
                }, 400);
            } else {
                event.preventDefault();

                if (event.keyCode === 38) {
                    // Up key, select previous element
                    SolrAutocomplete.selectPreviousDropdownItem();
                } else {
                    // Down key, select next element
                    SolrAutocomplete.selectNextDropdownItem();
                }
            }
        });
    });
});