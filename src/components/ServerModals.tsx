import React, { useState } from 'react';
import { X, Gamepad2, Briefcase, GraduationCap, Shield, Users, Hash, Trash2, Save } from 'lucide-react';

// --- SUNUCU OLUŞTURMA MODALI (Sihirbaz) ---
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
                    <p className="text-gray-400 text-sm mb-6">Yeni topluluğun ne hakkında olacak?</p>

                    {step === 1 ? (
                        <div className="space-y-3">
                            <button onClick={() => { setType('gaming'); setStep(2); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-indigo-600/20 hover:border-indigo-500 transition group text-left">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition"><Gamepad2 size={20} /></div>
                                <div><div className="font-bold text-white">Oyun</div><div className="text-xs text-gray-400">Klanlar, arkadaşlar ve turnuvalar.</div></div>
                            </button>
                            <button onClick={() => { setType('work'); setStep(2); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-green-600/20 hover:border-green-500 transition group text-left">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition"><Briefcase size={20} /></div>
                                <div><div className="font-bold text-white">İş / Profesyonel</div><div className="text-xs text-gray-400">Ekipler ve projeler için.</div></div>
                            </button>
                            <button onClick={() => { setType('school'); setStep(2); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-yellow-600/20 hover:border-yellow-500 transition group text-left">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition"><GraduationCap size={20} /></div>
                                <div><div className="font-bold text-white">Okul / Kulüp</div><div className="text-xs text-gray-400">Ders notları ve etkinlikler.</div></div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-24 h-24 mx-auto rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4">
                                {serverName ? serverName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="text-left">
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">SUNUCU ADI</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={serverName}
                                    onChange={(e) => setServerName(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition"
                                    placeholder="Örn: Çılgın Oyuncular"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
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

// --- SUNUCU AYARLARI MODALI ---
export const ServerSettingsModal = ({ isOpen, onClose, server }: any) => {
    const [activeTab, setActiveTab] = useState('overview');
    if (!isOpen || !server) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-4xl h-[600px] bg-[#1e1f2b] border border-white/10 rounded-2xl flex overflow-hidden shadow-2xl">
                {/* SOL MENÜ */}
                <div className="w-60 bg-[#15161e] p-4 flex flex-col gap-1">
                    <div className="px-2 py-4 mb-2">
                        <h3 className="font-bold text-gray-400 text-xs uppercase">{server.name}</h3>
                    </div>
                    <SettingsTab label="Genel Bakış" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <SettingsTab label="Roller" active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} />
                    <SettingsTab label="Üyeler" active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
                    <div className="my-2 border-t border-white/5"></div>
                    <SettingsTab label="Sunucuyu Sil" danger onClick={() => alert("Bu özellik henüz aktif değil!")} />
                </div>

                {/* SAĞ İÇERİK */}
                <div className="flex-1 bg-[#1e1f2b] p-8 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 flex flex-col items-center justify-center w-8 h-8 border-2 border-gray-500 rounded-full text-gray-500 hover:border-white hover:text-white transition">
                        <X size={16} className="font-bold" />
                    </button>

                    {activeTab === 'overview' && (
                        <div className="max-w-lg">
                            <h2 className="text-xl font-bold text-white mb-6">Sunucu Genel Bakış</h2>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white">{server.icon}</div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 mb-2">Minimum 512x512px önerilir.</p>
                                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition">İkon Yükle</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">SUNUCU ADI</label>
                                    <input type="text" defaultValue={server.name} className="w-full bg-[#15161e] border border-black/20 rounded p-2 text-white mt-1 outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'roles' && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Roller</h2>
                            <p className="text-gray-400 text-sm mb-6">Üyelerin izinlerini buradan yönetebilirsin.</p>
                            <div className="space-y-2">
                                <RoleItem name="Yönetici" color="bg-red-500" />
                                <RoleItem name="Moderatör" color="bg-green-500" />
                                <RoleItem name="Üye" color="bg-blue-500" />
                                <RoleItem name="@everyone" color="bg-gray-500" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SettingsTab = ({ label, active, onClick, danger }: any) => (
    <button onClick={onClick} className={`text-left px-2 py-1.5 rounded text-sm font-medium transition ${active ? 'bg-white/10 text-white' : danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
        {label}
    </button>
);

const RoleItem = ({ name, color }: any) => (
    <div className="flex items-center justify-between p-3 bg-[#15161e] rounded border border-white/5 cursor-pointer hover:border-white/10">
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            <span className="text-white font-medium">{name}</span>
        </div>
        <Shield size={16} className="text-gray-500" />
    </div>
);