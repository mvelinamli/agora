#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Basit bir selamlama komutu (Frontend'den çağrılabilir)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Merhaba, {}! AGORA Sistemine Hoş Geldin.", name)
}

fn main() {
    tauri::Builder::default()
        // greet fonksiyonunu sisteme tanıtıyoruz
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("AGORA başlatılırken hata oluştu!");
}