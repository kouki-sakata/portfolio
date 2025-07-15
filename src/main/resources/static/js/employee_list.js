$(function () {
  $('input[name="tbody_toggle"]').on("change", function () {
    const selectedValue = $(this).val();
    if (selectedValue === "no_admin") {
      $("#no_admin").removeClass("d-none");
      $("#admin").addClass("d-none");
    } else {
      $("#no_admin").addClass("d-none");
      $("#admin").removeClass("d-none");
    }
  });
});
