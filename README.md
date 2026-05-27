<div align="center">

<img src="public/appicon.png" alt="Pulp" width="120" />

# Pulp

**Gestor de portapapeles ligero para Windows y Linux**

[![Última versión](https://img.shields.io/github/v/release/Gudiii05/pulp?style=flat-square&color=ff5c2b)](https://github.com/Gudiii05/pulp/releases/latest)
[![Descargas](https://img.shields.io/github/downloads/Gudiii05/pulp/total?style=flat-square&color=ff5c2b)](https://github.com/Gudiii05/pulp/releases)
[![Licencia](https://img.shields.io/github/license/Gudiii05/pulp?style=flat-square&color=ff5c2b)](LICENSE)

</div>

---

Pulp es un gestor de portapapeles ligero para Windows y Linux. Vive en la bandeja del sistema y se abre con un atajo de teclado configurable. Cada vez que copias algo (texto, código o una imagen), Pulp lo guarda automáticamente para que puedas volver a usarlo en cualquier momento.

Diseño inspirado en Apple, modo claro y oscuro, búsqueda en tiempo real y la posibilidad de fijar tus copias favoritas para que no se borren. Pensado para que escribas menos y trabajes más rápido.

## Características

- **Vive en la bandeja del sistema** — invisible hasta que lo necesites.
- **Atajo global configurable** — abre Pulp desde cualquier aplicación con la combinación que prefieras (por defecto `Ctrl + Shift + V`).
- **Detección automática del tipo de contenido** — Pulp clasifica cada copia como texto, código o imagen.
- **Fija tus copias** — las que fijas no se borran nunca, ni siquiera cuando se alcanza el límite del historial.
- **Búsqueda en tiempo real** — escribe lo que buscas y la lista se filtra al instante.
- **Modo claro y oscuro** — con cambio manual o automático según el sistema.
- **Diseño glassmorphism** — interfaz translúcida y limpia inspirada en macOS.
- **Actualizaciones automáticas** — Pulp comprueba si hay versiones nuevas al arrancar y te avisa.
- **Privado** — toda tu información se guarda en local. Pulp nunca envía nada a ningún servidor.

## Instalación

### Windows

1. Ve a la [página de Releases](https://github.com/Gudiii05/pulp/releases/latest).
2. Descarga el instalador que prefieras:
   - **`Pulp_X.Y.Z_x64-setup.exe`** — instalador ligero (recomendado).
   - **`Pulp_X.Y.Z_x64_en-US.msi`** — instalador MSI para entornos corporativos.
3. Haz doble clic en el archivo descargado.
4. **Windows SmartScreen** te mostrará un aviso indicando que el editor no es conocido. Esto es normal: el binario no está firmado con un certificado de Authenticode (un certificado de pago). Haz clic en **"Más información"** y luego en **"Ejecutar de todas formas"**.
5. Sigue el asistente de instalación.

Pulp se instalará en `%LOCALAPPDATA%\Pulp` y añadirá un acceso directo en el menú de inicio.

### Linux

Soportado en distribuciones modernas con **Ubuntu 22.04+** (o equivalente: Debian 12+, Fedora 38+, Arch reciente). Antes de instalar, asegurate de que la sesión sea **X11 / XWayland**, no Wayland puro (ver [Limitaciones en Linux](#limitaciones-en-linux)).

**Opción A — AppImage (recomendado, portable):**

1. Descargá `Pulp_X.Y.Z_amd64.AppImage` desde [Releases](https://github.com/Gudiii05/pulp/releases/latest).
2. Dale permisos de ejecución y corré:
   ```bash
   chmod +x Pulp_X.Y.Z_amd64.AppImage
   ./Pulp_X.Y.Z_amd64.AppImage
   ```

**Opción B — `.deb` (Debian / Ubuntu):**

1. Descargá `Pulp_X.Y.Z_amd64.deb` desde Releases.
2. Instalá con:
   ```bash
   sudo dpkg -i Pulp_X.Y.Z_amd64.deb
   sudo apt-get install -f  # resuelve dependencias si faltan
   ```

**Dependencias del sistema** (las resuelve `apt-get install -f` automáticamente):

- `libwebkit2gtk-4.1-0` — motor de renderizado web
- `libayatana-appindicator3-1` (o `libappindicator3-1` en distros viejas) — soporte para icono de bandeja

## Cómo se usa

### Capturar copias

No necesitas hacer nada especial. Una vez que Pulp esté abierto (en segundo plano, en la bandeja del sistema), **cualquier `Ctrl + C` que hagas** en cualquier aplicación se guarda automáticamente. Pulp comprueba el portapapeles cada 500 milisegundos.

### Abrir Pulp

Tienes varias formas de abrir la ventana de Pulp:

- **Atajo de teclado:** pulsa `Ctrl + Shift + V` desde cualquier sitio (puedes cambiarlo en Ajustes).
- **Bandeja del sistema:** haz clic en el icono naranja con la "P" en la esquina inferior derecha de la pantalla.
- **Click derecho** en el icono de la bandeja para ver el menú con opciones: Abrir, Limpiar todo, Salir.

### Volver a copiar algo del historial

Haz clic en cualquier elemento de la lista. Eso lo copia al portapapeles y aparece un mensaje "Copied!". Ya puedes pegarlo donde quieras con `Ctrl + V`.

### Filtrar por tipo

En la barra superior tienes cuatro pestañas: **All**, **Text**, **Code**, **Image**. Pulsa una para ver solo las copias de ese tipo. El filtro se combina con la búsqueda.

### Fijar copias importantes

Pasa el ratón por encima de cualquier copia y aparecerán dos iconos en la esquina superior derecha: un **pin** y una **papelera**. Pulsa el pin para fijar esa copia.

Las copias fijadas:
- Aparecen siempre arriba de la lista.
- No se borran nunca, ni siquiera cuando se alcanza el límite del historial (200 elementos por defecto).

### Cambiar el atajo de teclado

1. Abre Pulp.
2. Haz clic en el icono del engranaje (arriba a la derecha).
3. En la sección **Open shortcut**, haz clic en el campo y pulsa la nueva combinación que quieras.
4. El cambio se guarda automáticamente.

La combinación debe incluir al menos un modificador (`Ctrl`, `Alt` o `Shift`) más una tecla.

### Cambiar entre modo claro y oscuro

Haz clic en el icono del sol/luna en la cabecera, junto al engranaje. Tu elección se guarda y persiste entre sesiones.

### Limpiar el historial

- **Una copia concreta:** pasa el ratón por encima y haz clic en el icono de la papelera.
- **Todo el historial:** botón **"Clear history"** abajo a la derecha. Las copias fijadas también se borran.
- **Atajo rápido desde la bandeja:** click derecho en el icono de Pulp → "Clear All".

## Atajos de teclado

| Acción | Atajo |
|--------|-------|
| Abrir/cerrar Pulp | `Ctrl + Shift + V` (configurable) |
| Cerrar ventana | Haz clic fuera de ella |
| Limpiar búsqueda | Haz clic en la `×` del campo de búsqueda |

## Limitaciones en Linux

El soporte de Linux apunta a sesiones **X11 / XWayland**. Bajo **Wayland puro** (GNOME 41+ por defecto en Ubuntu, Fedora Workstation), el modelo de seguridad de Wayland impone restricciones que no se pueden saltar desde la app:

1. **Atajo global no funciona en GNOME Wayland.** Wayland no permite que aplicaciones de terceros registren atajos globales. Workaround: configurá el atajo manualmente en *Configuración → Teclado → Atajos personalizados* apuntando al binario de Pulp. En X11 / XWayland funciona normal.
2. **Icono de bandeja requiere extensión en GNOME.** GNOME removió el soporte nativo de tray icons. Instalá la extensión [AppIndicator and KStatusNotifierItem Support](https://extensions.gnome.org/extension/615/appindicator-support/) para que aparezca el ícono. En KDE Plasma, XFCE, Cinnamon y MATE funciona sin extra.
3. **Captura automática del portapapeles degradada en Wayland puro.** Wayland bloquea la lectura del portapapeles en segundo plano por diseño (no es un bug, es la política de seguridad). En Wayland puro, Pulp solo capturará lo que copies *mientras la ventana de Pulp esté abierta*. En X11 / XWayland, la captura automática funciona normal.
4. **Auto-actualización no disponible en `.deb`.** El paquete `.deb` no incluye el updater integrado (el sistema de paquetes lo gestiona el SO). En AppImage el updater integrado sí funciona.
5. **Autostart no expuesto en la UI bajo Linux.** El toggle de "iniciar al arrancar" está oculto en Linux por diferencias entre entornos de escritorio. Si lo querés, agregalo manualmente como `.desktop` en `~/.config/autostart/`.

## Privacidad

Pulp guarda todo en local en una base de datos SQLite ubicada en:

- **Windows:** `%APPDATA%\com.pulp.clipboard\pulp.db`
- **Linux:** `~/.local/share/com.pulp.clipboard/pulp.db`

No envía ningún dato a ningún servidor. Lo único que sale a internet es la consulta a GitHub para comprobar si hay actualizaciones (puedes desactivarlo cortando la conexión, no hay ningún tracking ni telemetría).

## Compilar desde el código fuente

Si quieres compilar Pulp tú mismo:

### Requisitos

- [Node.js 20+](https://nodejs.org/)
- [Rust](https://rustup.rs/) (instala el toolchain MSVC en Windows)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) con el componente "Desktop development with C++"

### Pasos

```powershell
git clone https://github.com/Gudiii05/pulp.git
cd pulp
npm install
npm run tauri dev      # ejecutar en modo desarrollo
npm run tauri build    # generar instaladores en src-tauri/target/release/bundle/
```

Los instaladores se generan en:

- `src-tauri/target/release/bundle/nsis/Pulp_X.Y.Z_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/Pulp_X.Y.Z_x64_en-US.msi`

## Tecnologías utilizadas

- **[Tauri 2](https://tauri.app/)** — framework para apps de escritorio con backend en Rust.
- **[React 19](https://react.dev/)** + **TypeScript** + **Vite** — interfaz.
- **[arboard](https://crates.io/crates/arboard)** — acceso al portapapeles del sistema.
- **[rusqlite](https://crates.io/crates/rusqlite)** — base de datos SQLite embebida.
- **CSS Modules** — sin Tailwind ni librerías de UI pesadas.

## Contribuir

Las pull requests son bienvenidas. Si encuentras un bug o tienes una propuesta:

1. Abre un [issue](https://github.com/Gudiii05/pulp/issues) describiéndolo.
2. Si tienes el arreglo, abre directamente un PR enlazando al issue.

## Licencia

[MIT](LICENSE) — usa Pulp para lo que quieras, modifícalo, distribúyelo. Solo mantén el aviso de copyright.
