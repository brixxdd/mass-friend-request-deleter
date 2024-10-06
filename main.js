var buttons = document.querySelectorAll('span'); 
buttons.forEach(function(button) {
    if (button.textContent.includes('Cancelar solicitud')) {
        button.click();
    }
});
