const tinyMceOptions = {
    height: 200,
    menubar: false,
    statusbar: false,
    toolbar: 'undo redo | bold italic | link | bullist numlist',
    plugins: 'link lists',

};

function loadDefaultData() {
    $.ajax({
        url: 'data.json',
        dataType: 'json',
        cache: false, // Füge diese Zeile hinzu, um den Cache zu umgehen
        success: function (data) {
            $('#main-container').empty(); // Löschen Sie die vorhandenen Abschnitte
            createSectionsFromData(data.sections);
            setInputFieldData(data.inputData);

            // TinyMCE-Editor initialisieren
            tinymce.remove('textarea'); // Entfernt alle bestehenden TinyMCE-Instanzen
            tinymce.init(Object.assign({selector: 'textarea'}, tinyMceOptions));
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Fehler beim Laden der Standarddatei:', textStatus, errorThrown);
        },
    });
}
$(document).ready(function () {
    loadDefaultData();
});



let hasChanges = false;
// Event-Handler für das Ändern des Inhalts
$('body').on('change keyup', 'input, textarea', function () {
    hasChanges = true;
});
$(window).on('beforeunload', function () {
    if (hasChanges) {
        return 'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
    }
});
$(window).on('beforeunload', function () {
    if (hasChanges) {
        return 'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
    }
});
$('#load-json-file').on('click', function (event) {
    if (hasChanges) {
        if (!confirm('Sie haben ungespeicherte Änderungen. Möchten Sie die Änderungen speichern und fortfahren?')) {
            event.preventDefault(); // Verhindert das Laden einer neuen Datei, wenn der Benutzer "Abbrechen" wählt
        } else {
            // Speichern Sie die Änderungen, bevor Sie fortfahren
            $('#save-json').trigger('click');
        }
    }
});


let loadedFilename = null;
// JSON laden
$('#load-json-file').on('change', function (event) {
    const file = event.target.files[0];
    // Überprüfen Sie, ob der Dateiname "data.json" ist
    if (file.name.toLowerCase() === 'data.json') {
        alert('Die Datei "data.json" kann nicht über den Laden-Button geladen werden.');
        $(this).val('');
        return; // Beenden Sie die Funktion, wenn der Dateiname "data.json" ist
    }
    const reader = new FileReader();

    reader.onload = (event) => {
        const content = event.target.result;
        const data = JSON.parse(content);
        $('#main-container').empty(); // Löschen Sie die vorhandenen Abschnitte
        createSectionsFromData(data.sections);
        setInputFieldData(data.inputData);
        loadedFilename = file.name; // Speichern Sie den Dateinamen der geladenen Datei
        $('#save-filename').val(file.name); // Zeigen Sie den geladenen Dateinamen im Feld "Dateiname zum Speichern" an
        hasChanges = false; // Setzen Sie den Wert von hasChanges zurück

    };
    reader.readAsText(file);
});

// JSON speichern
const ensureJsonExtension = (filename) => {
    if (!filename.endsWith('.json')) {
        return filename + '.json';
    }
    return filename;
};

$('#save-json').on('click', function () {
    tinymce.triggerSave(); // Aktualisiert den Inhalt der Textareas
    updateSectionNumbers();
    // Aktualisieren Sie die Titel der Haupt- und Unterabschnitte
    $('.main-section-title, .sub-section-title').each(function () {
        const titleInput = $(this);
        const titleVal = titleInput.val();
        titleInput.val(titleVal);
    });

    // Setzt den hasChanges-Status, wenn ein Titel bearbeitet wurde
    $('.main-section-title, .sub-section-title').on('input', function () {
        hasChanges = true;
    });
    // Überprüfen Sie, ob das Eingabefeld für den Dateinamen leer ist oder "data" als Dateinamen enthält
    const filenameInput = $('#save-filename');
    if (filenameInput.val().trim() === '') {
        alert('Bitte geben Sie einen Dateinamen ein, bevor Sie die Datei speichern.');
        return; // Beenden Sie die Funktion, wenn das Eingabefeld für den Dateinamen leer ist
    } else if (filenameInput.val().trim().toLowerCase() === 'data') {
        alert('Der Dateiname "data" ist nicht zulässig. Bitte wählen Sie einen anderen Dateinamen.');
        return; // Beenden Sie die Funktion, wenn der Dateiname "data" ist
    }

    const content = getCurrentData();

    const saveFile = (filename) => {
        const filenameWithExtension = ensureJsonExtension(filename);
        $.ajax({
            url: 'json_handler.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'save', filename: filenameWithExtension, content }),
            success: function (response) {
                alert('JSON gespeichert!');
                loadedFilename = filenameWithExtension; // Aktualisieren Sie den Dateinamen der geladenen Datei
            $('#save-filename').val(filenameWithExtension); // Zeigen Sie den geladenen Dateinamen im Feld "Dateiname zum Speichern" an
            hasChanges = false; // Setze hasChanges auf false, nachdem die Datei erfolgreich gespeichert wurde

        
            },
        });
    };

    if (loadedFilename) {
        // Warnmeldung anzeigen, wenn eine Datei geladen wurde
        const overwrite = confirm('Möchten Sie die geladene Datei überschreiben?');
        if (overwrite) {
            saveFile(loadedFilename);
        } else {
            const newFilename = prompt('Bitte geben Sie einen neuen Dateinamen ein:');
            if (newFilename) {
                saveFile(newFilename);
            } else {
                alert('Speichern abgebrochen.');
            }
        }
    } else {
        const filename = $('#save-filename').val() || 'data.json'; // Verwenden Sie den eingegebenen Dateinamen oder den Standardwert 'data.json'
        saveFile(filename);
    }
    hasChanges = false;
});


$('#save-template').on('click', function () {
    tinymce.triggerSave(); // Aktualisiert den Inhalt der Textareas
    updateSectionNumbers();
    const originalFilename = $('#save-filename').val();
    $('#save-filename').val('data.json');
    const saveTemplate = () => {
        tinymce.triggerSave(); // Aktualisiert den Inhalt der Textareas
        $('.main-section-title, .sub-section-title').each(function () {
            const titleInput = $(this);
            const titleVal = titleInput.val();
            titleInput.val(titleVal);
        });
        const content = getCurrentData();

        $.ajax({
            url: 'json_handler.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'save', filename: 'data.json', content }),
            success: function (response) {
                alert('Vorlage gespeichert!');
            }

            
        });
        hasChanges = false; // Setze hasChanges auf false, nachdem die Datei erfolgreich gespeichert wurde

    };

    const firstWarning = confirm('Möchten Sie die Vorlage wirklich überschreiben?');
    if (firstWarning) {
        const secondWarning = confirm('Möchten Sie die Vorlage wirklich überschreiben? Diese Aktion kann nicht rückgängig gemacht werden.');
        if (secondWarning) {
            saveTemplate();
        } else {
            alert('Speichern der Vorlage abgebrochen.');
        }
    } else {
        alert('Speichern der Vorlage abgebrochen.');
    }
    $('#save-filename').val(originalFilename);

});



// Funktion zum Hinzufügen eines Hauptabschnitts
function addMainSection(title, content) {
    const sectionWrapper = $('<div class="section-wrapper"></div>');    
    const mainSection = $('<div class="main-section"></div>');
    const mainSectionHandle = $('<div class="handle main-section-handle">&#x2195;</div>');
    const mainContentTextareaId = 'main-section-content-' + Date.now();
    const titleInput = $(`<input type="text" class="mb-1 form-control main-section-title" value="${title || ''}">`);
    const contentTextarea = $(`<textarea class="mb-1 form-control main-section-content" id="${mainContentTextareaId}">${content || ''}</textarea>`);
    const deleteMainButton = $('<button class="btn btn-sm btn-danger delete-section mt-1 mb-1">Hauptabschnitt löschen</button>');
    const addSubButton = $('<button class="btn btn-sm btn-primary add-subsection mt-1 mb-1">Unterabschnitt hinzufügen</button>');

    mainSection.append(mainSectionHandle);
    mainSection.append(titleInput);
    mainSection.append(contentTextarea);
    mainSection.append(deleteMainButton);
    mainSection.append(addSubButton);

    // Event-Handler für das Hinzufügen von Unterabschnitten
    mainSection.on('click', '.add-subsection', function () {
        const parent = $(this).closest('.main-section');
        addSubSection(parent);
    });

    // Event-Handler für das Löschen von Hauptabschnitten
    mainSection.on('click', '.delete-section', function () {
        $(this).closest('.main-section').remove();
    });
    
    sectionWrapper.append(mainSection);
    $('#main-container').append(sectionWrapper).promise().then(updateSectionNumbers);
    tinymce.init({ ...tinyMceOptions, selector: '#' + mainContentTextareaId });
    updateSectionNumbers();
}

function addSubSection(parent, title, content) {
    
    const subSection = $('<div class="sub-section"></div>');
    const subSectionHandle = $('<div class="handle sub-section-handle">&#x2195;</div>');
    const titleInput = $(`<input type="text" class="form-control sub-section-title mb-1" value="${title || ''}">`);
    const deleteSubButton = $('<button class="btn btn-sm btn-danger delete-subsection mb-1 mt-1">Unterabschnitt löschen</button>');
    const subContentTextareaId = 'sub-section-content-' + Date.now();
    const contentTextarea = $(`<textarea class="form-control sub-section-content" id="${subContentTextareaId}">${content || ''}</textarea>`);
    subSection.append(subSectionHandle);
    subSection.append(titleInput);
    subSection.append(contentTextarea);
    subSection.append(deleteSubButton);
    

    // Event-Handler für das Löschen von Unterabschnitten
    subSection.on('click', '.delete-subsection', function () {
        $(this).closest('.sub-section').remove();
    });

    parent.append(subSection).promise().then(updateSectionNumbers);
    tinymce.init({ ...tinyMceOptions, selector: '#' + subContentTextareaId });
    updateSectionNumbers();
}

function getDataFromSections() {
    const mainSectionsData = [];

    $('.main-section').each(function () {
        const mainSection = $(this);
        const mainTitle = mainSection.find('.main-section-title').val();
        const mainContent = tinymce.get(mainSection.find('.main-section-content').attr('id')).getContent();
        const subSectionsData = [];

        mainSection.find('.sub-section').each(function () {
            const subSection = $(this);
            const subTitle = subSection.find('.sub-section-title').val();
            const subContent = tinymce.get(subSection.find('.sub-section-content').attr('id')).getContent();

            subSectionsData.push({ title: subTitle, content: subContent });
        });

        mainSectionsData.push({ title: mainTitle, content: mainContent, subSections: subSectionsData });
    });

    return mainSectionsData;
}


function createSectionsFromData(data) {
    data.forEach((mainSectionData) => {
        addMainSection(mainSectionData.title, mainSectionData.content);

        const mainSection = $('.main-section').last();
        mainSectionData.subSections.forEach((subSectionData) => {
            addSubSection(mainSection, subSectionData.title, subSectionData.content);
        });
    });
}

// Funktion zum Abrufen der aktuellen Daten aus den Haupt- und Unterabschnitten
function getCurrentData() {
    const inputData = {
        firma: $('#firma').val(),
        person: $('#person').val(),
        adresse: $('#adresse').val(),
        plz: $('#plz').val(),
        ort: $('#ort').val(),
        telefon: $('#telefon').val(),
        mail: $('#mail').val(),
    };
    return { sections: getDataFromSections(), inputData };
}

$(document).ready(function () {
    addMainSection("Beispiel Hauptabschnitt", "<p>Beispielinhalt für den Hauptabschnitt</p>");
    const mainSection = $(".main-section").last();
    addSubSection(mainSection, "Beispiel Unterabschnitt", "<p>Beispielinhalt für den Unterabschnitt</p>");
});
function updateAllTinyMCEEditors() {
    tinymce.editors.forEach((editor) => {
        editor.save(); // Aktualisiert den Inhalt der zugehörigen Textarea
    });
}

// Ereignishandler zum Hinzufügen eines Hauptabschnitts
$('#add-main-section').on('click', function () {
    addMainSection();
});
// Hauptabschnitte sortierbar machen
$('#main-container').sortable({
    placeholder: "sortable-placeholder",
    handle: ".main-section-handle",
    onStart: function () {
        updateAllTinyMCEEditors();
    },
    onEnd: function () {
        updateAllTinyMCEEditors();
        updateSectionNumbers();
    },
    cancel: "textarea, button, input", // Verhindert, dass das Sortieren durch Klicken auf Textbereiche, Schaltflächen oder Eingabefelder ausgelöst wird
    update: function (event, ui) {
        updateSectionNumbers();
    }
});

// Unterabschnitte innerhalb der Hauptabschnitte sortierbar machen
$(document).on('mouseenter', '.main-section', function () {
    if (!$(this).data("sortable-initialized")) { // Stellen Sie sicher, dass die Sortierfunktion nur einmal initialisiert wird
        $(this).sortable({
            items: '.sub-section',
            placeholder: "sortable-placeholder",
            handle: ".sub-section-handle",
            onStart: function () {
                updateAllTinyMCEEditors();
            },
            onEnd: function () {
                updateAllTinyMCEEditors();
                updateSectionNumbers();
            },
            connectWith: '.main-section', // Erlaubt das Verschieben von Unterabschnitten zwischen verschiedenen Hauptabschnitten
            cancel: "textarea, button, input", // Verhindert, dass das Sortieren durch Klicken auf Textbereiche, Schaltflächen oder Eingabefelder ausgelöst wird
            update: function (event, ui) {
                updateSectionNumbers();
            }
        });
        $(this).data("sortable-initialized", true);
    }
});

function updateSectionNumbers() {
    $('.main-section').each(function (mainIndex) {
        const mainSection = $(this);
        const mainTitle = mainSection.find('.main-section-title');
        const mainTitleVal = mainTitle.val().replace(/^[0-9]+\. /, '');
        mainTitle.val(`${mainIndex + 1}. ${mainTitleVal}`);

        mainSection.find('.sub-section').each(function (subIndex) {
            const subSection = $(this);
            const subTitle = subSection.find('.sub-section-title');
            const subTitleVal = subTitle.val().replace(/^[0-9]+\.[0-9]+ /, '');
            subTitle.val(`${mainIndex + 1}.${subIndex + 1} ${subTitleVal}`);
        });
    });
}


// Funktion zum Ersetzen der Platzhalter
function replacePlaceholders(content) {
    const placeholders = {
      '{firma}': $('#firma').val(),
      '{person}': $('#person').val(),
      '{adresse}': $('#adresse').val(),
      '{plz}': $('#plz').val(),
      '{ort}': $('#ort').val(),
      '{telefon}': $('#telefon').val(),
      '{mail}': $('#mail').val(),
    };
  
    for (const placeholder in placeholders) {
      content = content.split(placeholder).join(placeholders[placeholder]);
    }
  
    return content;
  }
function generateContent() {
    let content = '';

    // Inhaltsverzeichnis erstellen
    content += '<h2>Inhaltsverzeichnis</h2><ul class="list-unstyled">';
    $('.main-section-title').each(function (index) {
        const mainSectionTitle = $(this).val();
        content += `<li class="mb-2"><a href="#main-${index + 1}">${mainSectionTitle}</a>`;
        content += '<ul class="list-unstyled ml-4">';
        const subSections = $(this).parent().find('.sub-section');
        subSections.each(function (subIndex) {
            const subSectionTitle = $(this).find('.sub-section-title').val();
            content += `<li class="mb-2"><a href="#sub-${index + 1}-${subIndex + 1}">${subSectionTitle}</a></li>`;
        });
        content += '</ul></li>';
    });
    content += '</ul>';

    // Hauptabschnitte und Unterabschnitte hinzufügen
    $('.main-section').each(function (mainIndex) {
        const mainSectionTitle = $(this).find('.main-section-title').val();
        const mainSectionContent = $(this).find('.main-section-content').val();

        content += `<h3 id="main-${mainIndex + 1}" class="mt-4">${mainSectionTitle}</h3>`;
        content += `<p>${mainSectionContent}</p>`;

        // Unterabschnitte hinzufügen
        $(this).find('.sub-section').each(function (subIndex) {
            const subSectionTitle = $(this).find('.sub-section-title').val();
            const subSectionContent = $(this).find('.sub-section-content').val();

            content += `<h4 id="sub-${mainIndex + 1}-${subIndex + 1}" class="mt-3">${subSectionTitle}</h4>`;
            content += `<p>${subSectionContent}</p>`;
        });
    });

    return content;
}

$('#generate').on('click', function () {
    let content = generateContent();
    content = replacePlaceholders(content); // Ersetzt die Platzhalter durch die tatsächlichen Werte

    const privacyStatementContainer = $('#privacy-statement-container');
    const privacyStatementContent = $('#privacy-statement-content');
    
    privacyStatementContent.html(content);
    privacyStatementContainer.show();
});

$('#close-privacy-statement').on('click', function() {
    $('#privacy-statement-container').hide();
});


function setInputFieldData(data) {
    if (!data) return;
    $('#firma').val(data.firma);
    $('#person').val(data.person);
    $('#adresse').val(data.adresse);
    $('#plz').val(data.plz);
    $('#ort').val(data.ort);
    $('#telefon').val(data.telefon);
    $('#mail').val(data.mail);
}
function copyHtmlToClipboard(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.fontFamily = 'Calibri, sans-serif'; // Setzt die Schriftart auf "Calibri"
    container.style.fontSize = '12pt'; // Setzt die Schriftgröße auf 12pt
    document.body.appendChild(container);
    const range = document.createRange();
    range.selectNode(container);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    document.body.removeChild(container);
}

$('#copy-content').on('click', function () {
    let content = generateContent();
    content = replacePlaceholders(content); // Ersetzt die Platzhalter durch die tatsächlichen Werte

    const wrapper = $('<div></div>').html(content);
    wrapper.find('#toc').remove(); // Entfernt das Element mit der ID "toc"

    // Setzt die Schriftart und -größe
    wrapper.css({
        'font-family': 'Calibri, sans-serif',
        'font-size': '12pt'
    });

    const htmlToCopy = wrapper.html();
    copyHtmlToClipboard(htmlToCopy);

    alert('Inhalt kopiert!');
});





