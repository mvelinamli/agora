import React, { useState } from 'react';
import { X, Gamepad2, Briefcase, GraduationCap, Shield, Hash, Volume2 } from 'lucide-react';

// --- MODAL 1: SUNUCU OLUŞTURMA ---
export const CreateServerModal = ({ isOpen, onClose, onCreate }: any) => {
    const [step, setStep] = useState(1);
    const [type, setType] = useState('');
    const [serverName, setServerName] = useState('');

    const handleCreate = () => {
        if (!serverName) return;
        onCreate(serverName, type);
        onClose();
        setStep(1); setType(''); setServerName('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-md bg-[#1e1f2b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>

                <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Sunucunu Özelleştir</h2>

                    {step === 1 ? (
                        <div className="space-y-3 mt-6">
                            <button onClick={() => { setType('gaming'); setStep(2); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-indigo-600/20 hover:border-indigo-500 transition group text-left">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition"><Gamepad2 size={20} /></div>
                                <div><div className="font-bold text-white">Oyun</div><div className="text-xs text-gray-400">Klanlar ve oyun arkadaşları.</div></div>
                            </button>
                            <button onClick={() => { setType('work'); setStep(2); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-green-600/20 hover:border-green-500 transition group text-left">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition"><Briefcase size={20} /></div>
                                <div><div className="font-bold text-white">İş / Proje</div><div className="text-xs text-gray-400">Ekipler ve start-uplar.</div></div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-4">
                            <div className="w-24 h-24 mx-auto rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4">
                                {serverName ? serverName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <input
                                autoFocus
                                type="text"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition"
                                placeholder="Sunucu Adı Giriniz"
                            />
                            <button onClick={handleCreate} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition">Oluştur</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MODAL 2: KANAL OLUŞTURMA (YENİ!) ---
export const CreateChannelModal = ({ isOpen, onClose, onCreate }: any) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'text' | 'voice'>('text');

    const handleCreate = () => {
        if (!name) return;
        onCreate(name, type);
        onClose();
        setName(''); setType('text');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-sm bg-[#1e1f2b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                <h2 className="text-xl font-bold text-white mb-6">Kanal Oluştur</h2>

                <div className="space-y-4">
                    <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                        <button onClick={() => setType('text')} className={`flex-1 py-2 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${type === 'text' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            <Hash size={16} /> Metin
                        </button>
                        <button onClick={() => setType('voice')} className={`flex-1 py-2 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${type === 'voice' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            <Volume2 size={16} /> Ses
                        </button>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">KANAL ADI</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition"
                            placeholder="yeni-kanal"
                        />
                    </div>

                    <button onClick={handleCreate} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition">Oluştur</button>
                </div>
            </div>
        </div>
    );
}

// --- MODAL 3: SUNUCU AYARLARI ---
export const ServerSettingsModal = ({ isOpen, onClose, server }: any) => {
    if (!isOpen || !server) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 bg-[#1e1f2b] p-8 rounded-2xl border border-white/10 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{server.name}</h2>
                <p className="text-gray-400">Sunucu ayarları yakında aktif olacak.</p>
                <button onClick={onClose} className="mt-6 px-6 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600">Kapat</button>
            </div>
        </div>
    );
};