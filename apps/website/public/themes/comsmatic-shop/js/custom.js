// to get current year
function getYear() {
    var currentDate = new Date();
    var currentYear = currentDate.getFullYear();
    var yearEl = document.querySelector("#displayYear");
    if (yearEl) { yearEl.innerHTML = currentYear; }
}

getYear();

//  menu overlay and button toggle
function openNav() {
    document.getElementById("myNav").classList.toggle("menu_width")
    document.querySelector(".custom_menu-btn").classList.toggle("menu_btn-style")
}