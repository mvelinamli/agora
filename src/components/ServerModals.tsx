import React, { useState, useRef } from 'react';
import { X, Gamepad2, Briefcase, GraduationCap, Shield, Hash, Volume2, Upload, Camera, Image as ImageIcon } from 'lucide-react';

// --- GELİŞMİŞ SUNUCU OLUŞTURMA MODALI ---
export const CreateServerModal = ({ isOpen, onClose, onCreate }: any) => {
    const [step, setStep] = useState(1);

    // Form Verileri
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        description: '',
        iconUrl: '', // Buraya Base64 gelecek
        isPublic: false
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // DOSYA SEÇME
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, iconUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // KAMERA AÇMA
    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert("Kamera açılamadı: " + err);
            setIsCameraOpen(false);
        }
    };

    // FOTOĞRAF ÇEKME
    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');

            setFormData({ ...formData, iconUrl: dataUrl });

            // Kamerayı Kapat
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraOpen(false);
        }
    };

    const handleCreate = () => {
        if (!formData.name) return;
        onCreate(formData);
        onClose();
        setStep(1);
        setFormData({ name: '', type: '', description: '', iconUrl: '', isPublic: false });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-md bg-[#1e1f2b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"><X size={20} /></button>

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
                            {/* RESİM YÜKLEME ALANI */}
                            <div className="flex justify-center">
                                {isCameraOpen ? (
                                    <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden">
                                        <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                                        <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-black font-bold rounded-full shadow-lg hover:scale-105 transition">Çek</button>
                                    </div>
                                ) : (
                                    <div className="relative group w-24 h-24">
                                        {formData.iconUrl ? (
                                            <img src={formData.iconUrl} alt="Icon" className="w-24 h-24 rounded-full object-cover border-4 border-[#1e1f2b] shadow-lg" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-dashed border-white/20">
                                                {formData.name ? formData.name.charAt(0).toUpperCase() : <Upload size={24} />}
                                            </div>
                                        )}

                                        {/* Hover Menüsü */}
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white" title="Dosya Seç"><ImageIcon size={16} /></button>
                                            <button onClick={startCamera} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white" title="Kamera"><Camera size={16} /></button>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                                    </div>
                                )}
                            </div>

                            {!isCameraOpen && (
                                <>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">Sunucu Adı *</label>
                                            <input autoFocus type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition" placeholder="Örn: Efsanevi Oyuncular" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">Açıklama</label>
                                            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition text-sm resize-none" placeholder="Bu sunucu ne hakkında?" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-2">
                                        <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition">Geri</button>
                                        <button onClick={handleCreate} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-500/20">Oluştur</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... Diğer bileşenler (CreateChannelModal, ServerSettingsModal vb.) aynı kalacak ...
// (Hızlıca aşağıya ekliyorum ki dosya tam olsun)

const CategoryButton = ({ icon, title, desc, onClick }: any) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-indigo-600/20 hover:border-indigo-500 transition group text-left">
        <div className="w-10 h-10 rounded-full bg-white/5 text-gray-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition">{icon}</div>
        <div><div className="font-bold text-white">{title}</div><div className="text-xs text-gray-400">{desc}</div></div>
    </button>
);

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