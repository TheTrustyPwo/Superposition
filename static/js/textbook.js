const pages = [
    ["<h1>Content page</h1>", "Here is a list of content"],
    ["10.1: Introduction"],
    ["10.2: Principle of Superposition"],
    ["10.3: Interference"],
    ["<h1>10.4: Interference of Two Wave Sources</h1>"],
    ["10.5.1: Diffraction of water waves"],
    ["10.5.2: Single Slit Diffraction Pattern"],
    ["10.5.3: Resolving Power"],
    ["10.6: Interference of Light Waves - Young's Double Slit Experiment"],
    ["10.7: Diffraction Grating"],
    ["10.8.1: Characteristics of Stationary Wave"],
    ["10.8.2: Stationary Waves in Strings"],
    ["10.8.3: Standing Waves in Air Columns"],
    ["10.8.4: What about the pressure?"]
];

let counter = 0;
content = document.querySelector(".content");
next = document.getElementById("next");
back = document.getElementById("back");

function updateContent() {
    let htmlContent = '';
    pages[counter].forEach(element => {
        htmlContent += element;
    });
    content.innerHTML = htmlContent;
}


updateContent();

next.addEventListener("click", () => {
    if (counter < pages.length - 1) {
        counter++;
        updateContent();
    }
}
);

back.addEventListener("click", () => {
    if (counter > 0) {
        counter--;
        updateContent();
    } else {
        window.location.href = "index.html";
    }
});
