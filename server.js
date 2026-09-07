const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // Liefert index.html, Woerterbuch.csv etc. aus

// 1. Liste aller verf\u00fcgbaren Profile / CSV-Dateien abfragen
app.get('/api/profiles', (req, res) => {
    fs.readdir(__dirname, (err, files) => {
        if (err) return res.status(500).send("Fehler beim Lesen");
        // Suche Dateien, die dem Muster Woerterbuch_*.csv oder Woerterbuch.csv entsprechen
        const profiles = files
            .filter(f => f.startsWith('Woerterbuch') && f.endsWith('.csv'))
            .map(f => {
                if (f === 'Woerterbuch.csv') return { name: 'Standard', file: f };
                const match = f.match(/^Woerterbuch_(.+)\.csv$/);
                return { name: match ? match[1] : f, file: f };
            });
        res.json(profiles);
    });
});

// 2. Neues Profil anlegen (Kopiert Woerterbuch.csv -> Woerterbuch_{profilename}.csv)
app.post('/api/profiles/create', (req, res) => {
    const { profileName } = req.body;
    if (!profileName) return res.status(400).send("Profilname fehlt");

    const sourcePath = path.join(__dirname, 'Woerterbuch.csv');
    const targetFile = `Woerterbuch_${profileName}.csv`;
    const targetPath = path.join(__dirname, targetFile);

    if (fs.existsSync(targetPath)) {
        return res.status(400).send("Profil existiert bereits!");
    }

    // Wenn Woerterbuch.csv existiert, kopieren, sonst leere Datei / Header erstellen
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
    } else {
        const defaultHeader = "Wort,Schwierigkeit,Thema,Lernstatus,Beispielsatz\n";
        fs.writeFileSync(targetPath, defaultHeader, 'utf8');
    }

    res.json({ success: true, fileName: targetFile, profileName });
});

// 3. Datei-Inhalt einer CSV-Datei laden
app.get('/api/load-csv', (req, res) => {
    const fileName = req.query.file || 'Woerterbuch.csv';
    const filePath = path.join(__dirname, fileName);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Datei nicht gefunden");
    }
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(content);
});

// 4. CSV-Datei speichern
app.post('/api/save-csv', (req, res) => {
    const { fileName, csvData } = req.body;
    if (!fileName) return res.status(400).send("Dateiname fehlt");
    
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, csvData, 'utf8');
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});