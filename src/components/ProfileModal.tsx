import React, { useRef, useState, useEffect } from 'react';
import { X, Share2, User, Share, Settings, Shield, Volume2, Bell, LogOut, Camera, Save, Image as ImageIcon } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

// --- ÖRNEK VERİ ---
const MOCK_DATA = {
    nodes: [{ id: 'me', name: 'Sen', val: 20, color: '#6366f1' }, { id: 'u1', name: 'Ayşe', val: 10, color: '#10b981' }],
    links: [{ source: 'me', target: 'u1', width: 3 }]
};

export const ProfileModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const fgRef = useRef<any>();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({
        name: "Ahmet.agora",
        bio: "Blockchain meraklısı, Rust geliştirici.",
        color: "bg-gradient-to-tr from-indigo-500 to-purple-600",
        avatarUrl: '' // Base64 resim buraya
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, avatarUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (isOpen && activeTab === 'network' && fgRef.current) {
            fgRef.current.d3Force('charge').strength(-100);
            setTimeout(() => fgRef.current.zoomToFit(400), 100);
        }
    }, [isOpen, activeTab]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-4xl h-[600px] bg-[#0b0c15] border border-white/10 rounded-3xl flex overflow-hidden shadow-2xl shadow-indigo-500/10">

                {/* SOL MENÜ */}
                <div className="w-64 bg-black/40 p-6 flex flex-col gap-6 border-r border-white/5">
                    <div className="text-center">
                        <div className={`w-24 h-24 rounded-full ${profile.color} mx-auto flex items-center justify-center font-bold text-4xl text-white shadow-lg mb-3 border-4 border-[#0b0c15] overflow-hidden relative group`}>
                            {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
                            {/* Hover Overlay */}
                            <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Camera size={24} />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                        <h2 className="text-white font-bold text-lg truncate">{profile.name}</h2>
                        <p className="text-xs text-indigo-400 font-mono bg-indigo-500/10 py-1 px-2 rounded mt-2 inline-block">0x71...9A2</p>
                    </div>
                    <nav className="flex-1 space-y-1">
                        <SidebarButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Profilim" />
                        <SidebarButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={<Share size={18} />} label="İlişki Ağı" />
                        <SidebarButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Ayarlar" />
                    </nav>
                    <button className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 p-3 rounded-xl transition text-sm font-medium"><LogOut size={18} /> Çıkış Yap</button>
                </div>

                {/* SAĞ İÇERİK */}
                <div className="flex-1 bg-[#050505] relative flex flex-col">
                    <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-white/5 hover:bg-white/20 rounded-full text-white transition"><X size={20} /></button>

                    {activeTab === 'profile' && (
                        <div className="p-8 overflow-y-auto h-full">
                            <h2 className="text-2xl font-bold text-white mb-1">Kullanıcı Profili</h2>
                            <p className="text-gray-500 text-sm mb-8">Toplulukta nasıl göründüğünü özelleştir.</p>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-6 relative overflow-hidden group">
                                <div className={`h-24 w-full ${profile.color} absolute top-0 left-0 opacity-30`}></div>
                                <div className="relative flex items-end gap-4 mt-8">
                                    <div className={`w-20 h-20 rounded-full ${profile.color} flex items-center justify-center text-3xl font-bold text-white border-4 border-[#0b0c15] overflow-hidden`}>
                                        {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
                                    </div>
                                    <button onClick={() => fileInputRef.current?.click()} className="mb-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">Fotoğraf Yükle</button>
                                </div>
                            </div>
                            <div className="space-y-4 max-w-md">
                                <div><label className="text-xs font-bold text-gray-400 uppercase">GÖRÜNEN İSİM</label><input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition" /></div>
                                <div><label className="text-xs font-bold text-gray-400 uppercase">HAKKINDA</label><textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-indigo-500 transition resize-none" /></div>
                                <button className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition"><Save size={18} /> Değişiklikleri Kaydet</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'network' && <ForceGraph2D ref={fgRef} graphData={MOCK_DATA} nodeLabel="name" nodeColor="color" backgroundColor="#050505" linkColor={() => 'rgba(255,255,255,0.1)'} nodeRelSize={7} />}

                    {activeTab === 'settings' && (
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-white mb-6">Ayarlar</h2>
                            <div className="p-4 bg-white/5 rounded-xl text-gray-400">Detaylı ayarlar eklenecek...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SidebarButton = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
        {icon} <span className="font-medium">{label}</span>
    </button>
);