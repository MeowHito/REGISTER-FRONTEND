jQuery(function ($) {

  'use strict';

  // Preloader
  // Mobile Dropdown
  // Search
  // Slick Slider
  // carousel Animation
  // tab view change
  // Price Slider
  // Jarallax
  // Remove Item
  // Video Player


  // -------------------------------------------------------------
  //  Preloader
  // -------------------------------------------------------------

  // $(window).on("load", function () {
  //   $('#preloader').fadeOut('slow', function () { $(this).remove(); });
  // });

  // -------------------------------------------------------------
  //  Mobile Dropdown
  // -------------------------------------------------------------

  // mobileDropdown();
  // function mobileDropdown() {
  //   if ($('.navbar-nav').length) {
  //     $('.navbar-nav .sa-dropdown').append(function () {
  //       return '<i class="fas fa-chevron-down icon"></i>';
  //     });
  //     $('.sa-dropdown .icon').on('click', function () {
  //       $(this).parent('li').children('ul').slideToggle();
  //     });
  //   }
  // }

  // -------------------------------------------------------------
  // Search
  // -------------------------------------------------------------

  $('.search-icon').on("click", function (event) {
    $('.open-search').css('height', '100vh');
    return false;
  });
  $('.close-search').on("click", function (event) {
    $('.open-search').css('height', '0');
    return false;
  });

  // -------------------------------------------------------------
  //  Toggle Menu
  // -------------------------------------------------------------


  $("body").on("click", ".sg-toggle", function (e) {
    e.preventDefault();
    $('body').toggleClass("sidebar-active");
    $(this).toggleClass("active");
  });

  $("body").on("click", "#close-menu, .header-right h2", function (e) {
    e.preventDefault();
    $('body').toggleClass("sidebar-active");
    $(this).toggleClass("active");
  });

  $("body").on("click", "#ncf-overlay", function (e) {
    e.preventDefault();
    $('body').removeClass("sidebar-active");
    $('.sg-toggle').removeClass("active");
  });

  // -------------------------------------------------------------
  //  Slick Slider
  // -------------------------------------------------------------  

  // $(".sa-course-slider").slick({
  //   infinite: false,
  //   dots: false,
  //   arrows: true,
  //   slidesToShow: 4,
  //   autoplay: true,
  //   autoplaySpeed: 1000,
  //   speed: 1000,
  //   pauseOnHover: true,
  //   slidesToScroll: 1,
  //   nextArrow: '<i class="icon-right fas fa-angle-right"></i>',
  //   prevArrow: '<i class="icon-left fas fa-angle-left"></i>',
  //   responsive: [
  //     {
  //       breakpoint: 1200,
  //       settings: {
  //         slidesToShow: 3,
  //       }
  //     },
  //     {
  //       breakpoint: 992,
  //       settings: {
  //         slidesToShow: 2,
  //       }
  //     },
  //     {
  //       breakpoint: 768,
  //       settings: {
  //         slidesToShow: 2,
  //       }
  //     },
  //     {
  //       breakpoint: 481,
  //       settings: {
  //         slidesToShow: 1,
  //       }
  //     }
  //   ]
  // });

  // $(".sa-course-slider-1").slick({
  //   infinite: false,
  //   dots: false,
  //   arrows: true,
  //   slidesToShow: 3,
  //   autoplay: true,
  //   autoplaySpeed: 1000,
  //   speed: 1000,
  //   pauseOnHover: true,
  //   slidesToScroll: 1,
  //   nextArrow: '<i class="icon-right fas fa-angle-right"></i>',
  //   prevArrow: '<i class="icon-left fas fa-angle-left"></i>',
  //   responsive: [
  //     {
  //       breakpoint: 1200,
  //       settings: {
  //         slidesToShow: 2,
  //       }
  //     },
  //     {
  //       breakpoint: 992,
  //       settings: {
  //         slidesToShow: 2,
  //       }
  //     },
  //     {
  //       breakpoint: 768,
  //       settings: {
  //         slidesToShow: 1,
  //       }
  //     },
  //     {
  //       breakpoint: 481,
  //       settings: {
  //         slidesToShow: 1,
  //       }
  //     }
  //   ]
  // });

  // $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
  //   $('.slick-slider').slick('setPosition');
  // })

  // $(".tutor-slider").slick({
  //   infinite: false,
  //   dots: false,
  //   arrows: true,
  //   slidesToShow: 4,
  //   autoplay: true,
  //   autoplaySpeed: 10000,
  //   speed: 1500,
  //   pauseOnHover: true,
  //   slidesToScroll: 1,
  //   nextArrow: '<i class="icon-right fas fa-angle-right"></i>',
  //   prevArrow: '<i class="icon-left fas fa-angle-left"></i>',
  //   responsive: [
  //     {
  //       breakpoint: 1200,
  //       settings: {
  //         slidesToShow: 4,
  //       }
  //     },
  //     {
  //       breakpoint: 992,
  //       settings: {
  //         slidesToShow: 3,
  //       }
  //     },
  //     {
  //       breakpoint: 768,
  //       settings: {
  //         slidesToShow: 2,
  //       }
  //     },
  //     {
  //       breakpoint: 481,
  //       settings: {
  //         slidesToShow: 1,
  //       }
  //     }
  //   ]
  // });

  // $(".brand-slider").slick({
  //   infinite: false,
  //   dots: false,
  //   arrows: true,
  //   slidesToShow: 5,
  //   autoplay: true,
  //   autoplaySpeed: 1000,
  //   speed: 1000,
  //   pauseOnHover: true,
  //   slidesToScroll: 1,
  //   nextArrow: '<i class="icon-right fas fa-angle-right"></i>',
  //   prevArrow: '<i class="icon-left fas fa-angle-left"></i>',
  //   responsive: [
  //     {
  //       breakpoint: 1200,
  //       settings: {
  //         slidesToShow: 4,
  //       }
  //     },
  //     {
  //       breakpoint: 992,
  //       settings: {
  //         slidesToShow: 3,
  //       }
  //     },
  //     {
  //       breakpoint: 768,
  //       settings: {
  //         slidesToShow: 2,
  //       }
  //     },
  //     {
  //       breakpoint: 450,
  //       settings: {
  //         slidesToShow: 1,
  //       }
  //     }
  //   ]
  // });

  // $(".testimonial-slider").slick({
  //   infinite: false,
  //   dots: true,
  //   arrows: true,
  //   slidesToShow: 1,
  //   autoplay: false,
  //   autoplaySpeed: 2000,
  //   speed: 1000,
  //   pauseOnHover: true,
  //   slidesToScroll: 1,
  //   nextArrow: '<i class="icon-right fas fa-angle-right"></i>',
  //   prevArrow: '<i class="icon-left fas fa-angle-left"></i>',
  // });

  // -------------------------------------------------------------
  //  carousel Animation
  // -------------------------------------------------------------

  function doAnimations(elems) {
    var animEndEv = 'webkitAnimationEnd animationend';
    elems.each(function () {
      var $this = $(this),
        $animationType = $this.data('animation');
      $this.addClass($animationType).one(animEndEv, function () {
        $this.removeClass($animationType);
      });
    });
  }
  var $mycarousel = $('#hero-slider'),
    $firstAnimatingElems = $mycarousel.find('.item:first').find("[data-animation ^= 'animated']");
  $mycarousel;

  doAnimations($firstAnimatingElems);
  $mycarousel;

  $mycarousel.on('slide.bs.carousel', function (e) {
    var $animatingElems = $(e.relatedTarget).find("[data-animation ^= 'animated']");
    doAnimations($animatingElems);
  });


  // -------------------------------------------------------------
  //  tab view change
  // -------------------------------------------------------------

  $('.sg-filter-content .list-view-tab').on('click', function () {
    $('.sg-filter-content .list-view-tab').addClass('active');
    $('.sg-filter-content .grid-view-tab').removeClass('active');
    $('.sg-filter-content').removeClass('grid-view-tab').addClass('list-view-tab');
  });

  $('.sg-filter-content .grid-view-tab').on('click', function () {
    $('.sg-filter-content .grid-view-tab').addClass('active');
    $('.sg-filter-content .list-view-tab').removeClass('active');
    $('.sg-filter-content').removeClass('list-view-tab').addClass('grid-view-tab');
  });


  // -------------------------------------------------------------
  //  Price Slider
  // -------------------------------------------------------------

  $("#price_slider").slider({
    range: true,
    min: 0,
    max: 3000,
    values: [0, 3000],
    slide: function (event, ui) {
      $("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
    }
  });
  $("#amount").val("$" + $("#price_slider").slider("values", 0) +
    " - $" + $("#price_slider").slider("values", 1));


  // -------------------------------------------------------------
  //  Jarallax
  // -------------------------------------------------------------

  // $('.jarallax').jarallax({
  //   speed: 0.2
  // });

  // -------------------------------------------------------------
  //  Remove Item
  // -------------------------------------------------------------

  $(".remove-icon").on('click', function () {
    $(this).parents('.remove-item').fadeOut();
  });

  // -------------------------------------------------------------
  //  Video Player
  // -------------------------------------------------------------

  $("#video-player").YTPlayer();
  /*==============================================================*/
  // Send Email
  /*==============================================================*/

  $('#contactform').submit(function (e) {
    $('.flashinfo').hide();
    e.preventDefault();
  })
    .validate({
      rules: {
        email: {
          required: true,
          email: true
        },
        phoneNumber: {
          digits: true,
          required: true,
          minlength: 5,
          maxlength: 12
        },
        name: {
          required: true,
          minlength: 5
        },
        subject: {
          required: true,
          minlength: 10
        },
        message: {
          required: true,
          minlength: 10
        }
      },
      messages: {
        email: {
          required: 'Check your email input '
        },
        name: {
          required: 'Please check your first name input'
        },
        subject: {
          required: 'Please check your message subject input'
        },
        message: {
          required: 'Please write something for us'
        }
      },
      submitHandler: function (form) {
        $.ajax({
          type: "POST",
          url: "https://mailpostexample.herokuapp.com/",
          data: $(form).serialize(),
          beforeSend: function () {
            $('.flashinfo').hide();
            $('.btn-l').html('Sending...')
            $('input, textarea').attr('readonly', "readonly");
          },
          success: function (msg) {
            if (msg == 'your message send') {
              $('#contactform').trigger("reset");
              $('.btn-l').html('Send Now')
              $('input, textarea').removeAttr('readonly');
              $('.flashinfo').show();
              $('.flashinfo').html('Your message has been sent, I will reply to you shortly');
            } else {
              $('input, textarea').removeAttr('readonly');
              $('#contactform').trigger("reset");
              $('.flashinfo').show();
              $('.flashinfo').html('<span>report_problem</span>something unknown error');
            }
          }
        });
        return false;
      }
    });

  // script end
});


