import React, { useState, useRef } from 'react';
import { X, Gamepad2, Briefcase, GraduationCap, Upload, Globe, Lock, Search, UserPlus, Hash, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// --- MODAL 1: SUNUCU OLUŞTURMA / KATILMA ---
export const CreateServerModal = ({ isOpen, onClose, onCreate, onJoin }: any) => {
    const [mode, setMode] = useState<'create' | 'join'>('create'); // Sekme Kontrolü

    // --- OLUŞTURMA STATE'LERİ ---
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', type: '', description: '', iconUrl: '', isPublic: false
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- KATILMA STATE'LERİ ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // ARAMA FONKSİYONU (Hem Kod Hem İsim)
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);

        // 1. Davet Koduyla Tam Eşleşme Ara
        const { data: byCode } = await supabase
            .from('servers')
            .select('*')
            .eq('invite_code', searchQuery);

        // 2. İsimle Ara (Sadece 'Public' olanları bulur)
        const { data: byName } = await supabase
            .from('servers')
            .select('*')
            .ilike('name', `%${searchQuery}%`) // İçinde geçen kelimeyi arar (Case Insensitive)
            .eq('is_public', true);

        // Sonuçları Birleştir (Tekrarları önleyerek)
        const combined = [...(byCode || []), ...(byName || [])];
        const uniqueResults = Array.from(new Map(combined.map(item => [item.id, item])).values());

        setSearchResults(uniqueResults);
        setSearching(false);
    };

    // Dosya Seçme (Base64 Çevirme)
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData({ ...formData, iconUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleCreateSubmit = () => {
        if (!formData.name) return;
        onCreate(formData);
        resetAndClose();
    };

    const resetAndClose = () => {
        onClose();
        // State'leri sıfırla
        setStep(1); setMode('create'); setSearchQuery(''); setSearchResults([]);
        setFormData({ name: '', type: '', description: '', iconUrl: '', isPublic: false });
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={resetAndClose}></div>
            <div className="relative z-50 w-full max-w-md bg-[#1e1f2b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"><X size={20} /></button>

                {/* ÜST SEKMELER (Tab) */}
                <div className="flex border-b border-white/5">
                    <button onClick={() => setMode('create')} className={`flex-1 py-4 font-bold text-sm transition ${mode === 'create' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>Sunucu Kur</button>
                    <button onClick={() => setMode('join')} className={`flex-1 py-4 font-bold text-sm transition ${mode === 'join' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>Bir Sunucuya Katıl</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {mode === 'create' ? (
                        // --- OLUŞTURMA EKRANI ---
                        <>
                            <h2 className="text-2xl font-bold text-white mb-1 text-center">Sunucunu Kur</h2>
                            <p className="text-gray-400 text-sm mb-6 text-center">Topluluğunu inşa etmeye başla.</p>

                            {step === 1 ? (
                                <div className="space-y-3">
                                    <CategoryButton icon={<Gamepad2 />} title="Oyun" desc="Klanlar ve arkadaşlar." onClick={() => { setFormData({ ...formData, type: 'gaming' }); setStep(2); }} />
                                    <CategoryButton icon={<Briefcase />} title="Profesyonel" desc="İş ve projeler." onClick={() => { setFormData({ ...formData, type: 'work' }); setStep(2); }} />
                                    <CategoryButton icon={<GraduationCap />} title="Eğitim" desc="Okul ve kulüpler." onClick={() => { setFormData({ ...formData, type: 'school' }); setStep(2); }} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Resim Yükleme */}
                                    <div className="flex justify-center">
                                        <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white cursor-pointer border-4 border-dashed border-white/20 hover:border-white/50 transition overflow-hidden relative group">
                                            {formData.iconUrl ? <img src={formData.iconUrl} className="w-full h-full object-cover" /> : (formData.name ? formData.name.charAt(0).toUpperCase() : <Upload size={24} />)}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Upload size={24} /></div>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                                    </div>

                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition" placeholder="Sunucu Adı *" />
                                    <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 resize-none" placeholder="Açıklama (İsteğe bağlı)" />

                                    {/* Public/Private Seçimi */}
                                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition" onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${formData.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{formData.isPublic ? <Globe size={18} /> : <Lock size={18} />}</div>
                                            <div><div className="text-sm font-bold text-white">{formData.isPublic ? 'Herkese Açık' : 'Gizli Sunucu'}</div><div className="text-xs text-gray-400">{formData.isPublic ? 'İsimle aranabilir.' : 'Sadece davet koduyla.'}</div></div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition ${formData.isPublic ? 'bg-green-500' : 'bg-gray-600'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isPublic ? 'left-6' : 'left-1'}`}></div></div>
                                    </div>

                                    <div className="flex gap-3 mt-2">
                                        <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-400 hover:bg-white/5 rounded-xl">Geri</button>
                                        <button onClick={handleCreateSubmit} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition hover:scale-[1.02]">Oluştur</button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // --- KATILMA EKRANI ---
                        <>
                            <h2 className="text-2xl font-bold text-white mb-1 text-center">Sunucuya Katıl</h2>
                            <p className="text-gray-400 text-sm mb-6 text-center">Davet kodunu veya sunucu adını gir.</p>

                            <div className="relative mb-6">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-10 text-white outline-none focus:border-indigo-500 transition"
                                    placeholder="Örn: Cyberpunk veya xK9z2A"
                                />
                                <Search size={18} className="absolute left-3 top-3.5 text-gray-500" />
                                <button onClick={handleSearch} disabled={searching} className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition disabled:opacity-50">
                                    {searching ? '...' : 'Ara'}
                                </button>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {searchResults.length > 0 ? searchResults.map(server => (
                                    <div key={server.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/50 transition group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                                                {server.icon_url ? <img src={server.icon_url} className="w-full h-full object-cover" /> : server.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-white text-sm truncate">{server.name}</div>
                                                <div className="text-xs text-gray-400 truncate">{server.description || 'Açıklama yok'}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => { onJoin(server); resetAndClose(); }} className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition flex items-center gap-2 text-xs font-bold px-3">
                                            <UserPlus size={16} /> Katıl
                                        </button>
                                    </div>
                                )) : (
                                    searchQuery && !searching && <div className="text-center text-gray-500 text-sm py-4">Sonuç bulunamadı.</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- KANAL OLUŞTURMA MODALI ---
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

// --- SUNUCU AYARLARI MODALI ---
export const ServerSettingsModal = ({ isOpen, onClose, server }: any) => {
    if (!isOpen || !server) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div><div className="relative z-50 bg-[#1e1f2b] p-8 rounded-2xl border border-white/10 text-center"><h2 className="text-2xl font-bold text-white mb-2">{server.name}</h2><p className="text-gray-400">Davet Kodu: <span className="text-white font-mono bg-black px-2 py-1 rounded select-all">{server.invite_code}</span></p><button onClick={onClose} className="mt-6 px-6 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600">Kapat</button></div></div>
    );
};

// Yardımcı
const CategoryButton = ({ icon, title, desc, onClick }: any) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-indigo-600/20 hover:border-indigo-500 transition group text-left"><div className="w-10 h-10 rounded-full bg-white/5 text-gray-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition">{icon}</div><div><div className="font-bold text-white">{title}</div><div className="text-xs text-gray-400">{desc}</div></div></button>
);