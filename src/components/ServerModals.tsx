import React, { useState } from 'react';
import { X, Gamepad2, Briefcase, GraduationCap, Upload, Globe, Lock, Hash, Volume2 } from 'lucide-react';

// --- GELİŞMİŞ SUNUCU OLUŞTURMA MODALI ---
export const CreateServerModal = ({ isOpen, onClose, onCreate }: any) => {
    const [step, setStep] = useState(1);

    // Form Verileri
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        description: '',
        iconUrl: '',
        isPublic: false
    });

    const handleCreate = () => {
        if (!formData.name) return;
        onCreate(formData); // Tüm veriyi gönder
        onClose();
        // Reset
        setStep(1);
        setFormData({ name: '', type: '', description: '', iconUrl: '', isPublic: false });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-md bg-[#1e1f2b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-1 text-center">Sunucunu Kur</h2>
                    <p className="text-gray-400 text-sm mb-6 text-center">Kendi topluluğunu sıfırdan inşa et.</p>

                    {step === 1 ? (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Kategori Seç</p>
                            <CategoryButton icon={<Gamepad2 />} title="Oyun" desc="Klanlar ve arkadaşlar." onClick={() => { setFormData({ ...formData, type: 'gaming' }); setStep(2); }} />
                            <CategoryButton icon={<Briefcase />} title="Profesyonel" desc="İş ve projeler." onClick={() => { setFormData({ ...formData, type: 'work' }); setStep(2); }} />
                            <CategoryButton icon={<GraduationCap />} title="Eğitim" desc="Okul ve kulüpler." onClick={() => { setFormData({ ...formData, type: 'school' }); setStep(2); }} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* İkon Yükleme (URL) */}
                            <div className="flex justify-center">
                                <div className="relative group cursor-pointer">
                                    {formData.iconUrl ? (
                                        <img src={formData.iconUrl} alt="Icon" className="w-24 h-24 rounded-full object-cover border-4 border-[#1e1f2b] shadow-lg" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-dashed border-white/20 group-hover:border-white/50 transition">
                                            {formData.name ? formData.name.charAt(0).toUpperCase() : <Upload size={24} />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Alanları */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Sunucu Adı *</label>
                                    <input autoFocus type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition" placeholder="Örn: Efsanevi Oyuncular" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Resim Linki (Opsiyonel)</label>
                                    <input type="text" value={formData.iconUrl} onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition text-sm" placeholder="https://..." />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Açıklama</label>
                                    <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition text-sm resize-none" placeholder="Bu sunucu ne hakkında?" />
                                </div>

                                {/* Public/Private Toggle */}
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer" onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${formData.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {formData.isPublic ? <Globe size={18} /> : <Lock size={18} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{formData.isPublic ? 'Herkese Açık' : 'Gizli Sunucu'}</div>
                                            <div className="text-xs text-gray-400">{formData.isPublic ? 'Herkes katılabilir.' : 'Sadece davetle.'}</div>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition ${formData.isPublic ? 'bg-green-500' : 'bg-gray-600'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isPublic ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition">Geri</button>
                                <button onClick={handleCreate} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-500/20">Oluştur</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Yardımcı Bileşen
const CategoryButton = ({ icon, title, desc, onClick }: any) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-indigo-600/20 hover:border-indigo-500 transition group text-left">
        <div className="w-10 h-10 rounded-full bg-white/5 text-gray-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition">{icon}</div>
        <div><div className="font-bold text-white">{title}</div><div className="text-xs text-gray-400">{desc}</div></div>
    </button>
);

// --- KANAL OLUŞTURMA ve AYARLAR MODALLARI (Aynı Kalıyor) ---
export const CreateChannelModal = ({ isOpen, onClose, onCreate }: any) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'text' | 'voice'>('text');
    const handleCreate = () => { if (!name) return; onCreate(name, type); onClose(); setName(''); setType('text'); };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-sm bg-[#1e1f2b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                <h2 className="text-xl font-bold text-white mb-6">Kanal Oluştur</h2>
                <div className="space-y-4">
                    <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                        <button onClick={() => setType('text')} className={`flex-1 py-2 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${type === 'text' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}><Hash size={16} /> Metin</button>
                        <button onClick={() => setType('voice')} className={`flex-1 py-2 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${type === 'voice' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}><Volume2 size={16} /> Ses</button>
                    </div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">KANAL ADI</label><input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition" placeholder="yeni-kanal" /></div>
                    <button onClick={handleCreate} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition">Oluştur</button>
                </div>
            </div>
        </div>
    );
}

export const ServerSettingsModal = ({ isOpen, onClose, server }: any) => {
    if (!isOpen || !server) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div><div className="relative z-50 bg-[#1e1f2b] p-8 rounded-2xl border border-white/10 text-center"><h2 className="text-2xl font-bold text-white mb-2">{server.name}</h2><p className="text-gray-400">Sunucu ayarları yakında aktif olacak.</p><button onClick={onClose} className="mt-6 px-6 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600">Kapat</button></div></div>
    );
};