import React, { useState, useEffect, useRef } from 'react';
import {
  Server, Hash, Volume2, Settings, Mic, MicOff, Headphones,
  EarOff, Send, Plus, Trash2, Sun, Moon, Users,
  MoreVertical, Heart, MessageSquare, Share2, Map, Radio
} from 'lucide-react';
import { WalletConnectButton } from './components/ui/WalletConnectButton';
import { ProfileModal } from './components/ProfileModal';
import { VoiceVisualizer } from './components/ui/VoiceVisualizer';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { LoginScreen } from './components/LoginScreen';
// EKSİK OLAN İMPORTLAR EKLENDİ:
import { CreateServerModal, ServerSettingsModal } from './components/ServerModals';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- NAVİGASYON VE DURUM ---
  const [activeTab, setActiveTab] = useState<'chat' | 'spatial' | 'feed'>('chat');
  const [activeServerId, setActiveServerId] = useState<number>(1);
  // KRİTİK DÜZELTME: Hangi kanalın açık olduğunu tutan değişken
  const [activeChannelId, setActiveChannelId] = useState<number | null>(1);
  const [showMembers, setShowMembers] = useState(true);

  // --- MODAL DURUMLARI ---
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isCreateServerOpen, setCreateServerOpen] = useState(false);
  const [isServerSettingsOpen, setServerSettingsOpen] = useState(false);

  // --- MEDYA DURUMLARI ---
  const [isMicMuted, setMicMuted] = useState(false);
  const [isDeafened, setDeafened] = useState(false);
  const [spatialMode, setSpatialMode] = useState(true);

  // --- VERİLER ---
  const [servers, setServers] = useState([
    { id: 1, name: "Cyberpunk TR", icon: "C", type: "gaming" },
    { id: 2, name: "Yazılımcılar", icon: "Y", type: "work" }
  ]);

  // DÜZELTME: Kanallara "serverId" eklendi
  const [channels, setChannels] = useState([
    { id: 1, serverId: 1, name: "genel", type: "text" },
    { id: 2, serverId: 1, name: "duyuru", type: "text" },
    { id: 3, serverId: 1, name: "Meydan", type: "voice" },
    { id: 4, serverId: 2, name: "toplantı", type: "voice" }
  ]);

  // DÜZELTME: Mesajlara "channelId" eklendi
  const [messages, setMessages] = useState([
    { id: 1, channelId: 1, user: "Mehmet", role: "Üye", msg: "Selamlar!", time: "12:30", color: "bg-blue-600" }
  ]);

  const [posts] = useState([
    { id: 1, user: "Ahmet.agora", content: "AGORA v1.0 yayında! 🚀", likes: 42, comments: 5 },
    { id: 2, user: "Can_Dev", content: "Rust backend performansı şaka mı?", likes: 128, comments: 24 }
  ]);

  const [members] = useState([
    { id: 1, name: "Ahmet.agora", role: "Kurucu", status: "online", avatarColor: "bg-indigo-500" },
    { id: 2, name: "Ayşe", role: "Moderatör", status: "idle", avatarColor: "bg-pink-500" },
  ]);

  // --- MANTIK MOTORU ---
  // Sadece seçili sunucunun kanallarını göster
  const visibleChannels = channels.filter(c => c.serverId === activeServerId);
  // Seçili kanalın ismini bul
  const activeChannel = channels.find(c => c.id === activeChannelId);
  // Sadece seçili kanalın mesajlarını göster
  const visibleMessages = messages.filter(m => m.channelId === activeChannelId);

  // --- İŞLEVLER ---

  const handleCreateServer = (name: string, type: string) => {
    const newId = Date.now();
    setServers([...servers, { id: newId, name, icon: name.charAt(0).toUpperCase(), type }]);
    // Yeni sunucuya varsayılan kanallar ekle
    const defaultChannels = [
      { id: newId + 1, serverId: newId, name: "genel", type: "text" },
      { id: newId + 2, serverId: newId, name: "sesli-sohbet", type: "voice" }
    ];
    setChannels([...channels, ...defaultChannels]);
    setActiveServerId(newId);
    setActiveChannelId(newId + 1);
    setActiveTab('chat');
  };

  const handleAddChannel = (type: string) => {
    const name = prompt(`${type === 'text' ? 'Metin' : 'Ses'} Kanalı Adı:`);
    if (name) {
      const newId = Date.now();
      // Yeni kanalı doğru sunucu ID'si ile oluştur
      setChannels([...channels, { id: newId, serverId: activeServerId, name, type }]);
      handleChannelClick({ id: newId, type }); // Oluşturunca hemen o kanala git
    }
  };

  const handleDeleteChannel = (id: number) => {
    if (confirm("Bu kanalı silmek istediğine emin misin?")) {
      setChannels(channels.filter(c => c.id !== id));
      if (activeChannelId === id) setActiveChannelId(null);
    }
  };

  // Kanal Tıklama Mantığı
  const handleChannelClick = (channel: any) => {
    setActiveChannelId(channel.id);
    if (channel.type === 'text') setActiveTab('chat');
    else setActiveTab('spatial');
  }

  // Mesaj Gönderme
  const [inputText, setInputText] = useState("");

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChannelId) return;

    const newMsg = {
      id: Date.now(),
      channelId: activeChannelId, // Mesajı doğru odaya gönder
      user: "Ahmet (Sen)",
      role: "Kurucu",
      msg: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: "bg-indigo-600"
    };
    setMessages([...messages, newMsg]);
    setInputText("");
  };

  // --- SES VE OYUN MOTORU ---
  const { analyser } = useAudioProcessor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState({ x: 300, y: 200 });

  useEffect(() => {
    if (activeTab === 'spatial' && spatialMode) {
      const handleMove = (e: KeyboardEvent) => {
        setPos(p => {
          const speed = 10;
          if (e.key === 'w' || e.key === 'ArrowUp') return { ...p, y: p.y - speed };
          if (e.key === 's' || e.key === 'ArrowDown') return { ...p, y: p.y + speed };
          if (e.key === 'a' || e.key === 'ArrowLeft') return { ...p, x: p.x - speed };
          if (e.key === 'd' || e.key === 'ArrowRight') return { ...p, x: p.x + speed };
          return p;
        });
      };
      window.addEventListener('keydown', handleMove);
      return () => window.removeEventListener('keydown', handleMove);
    }
  }, [activeTab, spatialMode]);

  useEffect(() => {
    if (activeTab === 'spatial' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const bgColor = isDarkMode ? '#1a1b26' : '#f3f4f6';
        const gridColor = isDarkMode ? '#333' : '#e5e7eb';
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, 800, 600);
        ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
        for (let i = 0; i < 800; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke(); }
        for (let i = 0; i < 600; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }
        ctx.fillStyle = '#4f46e5'; ctx.beginPath(); ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isDarkMode ? 'white' : 'black'; ctx.font = '12px Arial'; ctx.fillText("Ahmet", pos.x - 15, pos.y - 25);
      }
    }
  }, [pos, activeTab, isDarkMode]);

  const theme = isDarkMode ? { bg: "bg-[#030712]", text: "text-gray-100" } : { bg: "bg-gray-100", text: "text-gray-900" };

  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className={`h-screen w-screen ${theme.bg} flex items-center justify-center p-4 overflow-hidden relative font-sans ${theme.text} transition-colors duration-300`}>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
      {/* MODALLAR BAĞLANDI */}
      <CreateServerModal isOpen={isCreateServerOpen} onClose={() => setCreateServerOpen(false)} onCreate={handleCreateServer} />
      <ServerSettingsModal isOpen={isServerSettingsOpen} onClose={() => setServerSettingsOpen(false)} server={servers.find(s => s.id === activeServerId)} />

      <div className="flex w-full h-full max-w-[1600px] gap-4 relative z-10">

        {/* 1. SOL SÜTUN: SUNUCULAR */}
        <div className="w-[72px] flex flex-col gap-3 shrink-0">
          <GlassPanel isDarkMode={isDarkMode} className="h-14 bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-lg group" onClick={() => setActiveTab('feed')}>
            <span className="font-bold text-xl text-white">A</span>
          </GlassPanel>

          <div className="w-full h-[2px] bg-gray-500/20 rounded-full"></div>

          {servers.map(s => (
            <GlassPanel key={s.id} isDarkMode={isDarkMode} onClick={() => { setActiveServerId(s.id); setActiveChannelId(null); setActiveTab('chat'); }} className={`h-[72px] flex items-center justify-center cursor-pointer transition-all border-l-4 ${activeServerId === s.id ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-500'}`}>
              <span className="font-bold text-lg">{s.icon}</span>
            </GlassPanel>
          ))}

          {/* YENİ SUNUCU OLUŞTURMA BUTONU DÜZELTİLDİ */}
          <GlassPanel isDarkMode={isDarkMode} onClick={() => setCreateServerOpen(true)} className="h-12 flex items-center justify-center cursor-pointer text-green-500 hover:text-green-400 transition-all">
            <Plus />
          </GlassPanel>

          <div className="mt-auto flex flex-col gap-2">
            <GlassPanel isDarkMode={isDarkMode} onClick={() => setIsDarkMode(!isDarkMode)} className="h-12 flex items-center justify-center cursor-pointer text-yellow-500 hover:text-yellow-400 transition-all">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </GlassPanel>
            <GlassPanel isDarkMode={isDarkMode} onClick={() => setProfileOpen(true)} className="h-12 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-500 transition-all"><Settings size={20} /></GlassPanel>
          </div>
        </div>

        {/* 2. ORTA SÜTUN: KANALLAR */}
        {activeTab !== 'feed' && (
          <div className="w-64 flex flex-col gap-4 shrink-0 animate-in slide-in-from-left-4 duration-300">
            <GlassPanel isDarkMode={isDarkMode} className="flex-1 p-3 flex flex-col">
              <header className="h-12 flex items-center justify-between px-2 font-bold text-lg border-b border-gray-500/10 mb-4">
                <span className="truncate">{servers.find(s => s.id === activeServerId)?.name}</span>
                <MoreVertical size={16} className="cursor-pointer text-gray-500 hover:text-white" onClick={() => setServerSettingsOpen(true)} />
              </header>

              <div className="space-y-6 overflow-y-auto custom-scrollbar">
                <div>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Metin Kanalları</h3>
                    <Plus size={12} className="cursor-pointer text-gray-500 hover:text-indigo-500" onClick={() => handleAddChannel('text')} />
                  </div>
                  {visibleChannels.filter(c => c.type === 'text').map(c => (
                    <ChannelItem key={c.id} name={c.name} type="text" active={activeChannelId === c.id} onDelete={() => handleDeleteChannel(c.id)} onClick={() => handleChannelClick(c)} isDarkMode={isDarkMode} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ses Odaları</h3>
                    <Plus size={12} className="cursor-pointer text-gray-500 hover:text-indigo-500" onClick={() => handleAddChannel('voice')} />
                  </div>
                  {visibleChannels.filter(c => c.type === 'voice').map(c => (
                    <ChannelItem key={c.id} name={c.name} type="voice" active={activeChannelId === c.id} onDelete={() => handleDeleteChannel(c.id)} onClick={() => handleChannelClick(c)} tag={c.name.includes('Meydan') ? 'CANLI' : ''} isDarkMode={isDarkMode} />
                  ))}
                </div>
              </div>
            </GlassPanel>

            <GlassPanel isDarkMode={isDarkMode} className="h-auto p-3 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg transition" onClick={() => setProfileOpen(true)}>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-inner">A</div>
                  <div className="text-sm font-bold leading-tight">Ahmet <span className="block text-[10px] text-gray-400 font-normal">#1923</span></div>
                </div>
                <div className="flex gap-1 text-gray-400">
                  <button onClick={() => setMicMuted(!isMicMuted)} className="p-1.5 rounded transition hover:bg-white/10">{isMicMuted ? <MicOff size={16} color="red" /> : <Mic size={16} />}</button>
                  <button onClick={() => setDeafened(!isDeafened)} className="p-1.5 rounded transition hover:bg-white/10">{isDeafened ? <EarOff size={16} color="red" /> : <Headphones size={16} />}</button>
                </div>
              </div>
              <div className="h-8 w-full opacity-80"><VoiceVisualizer analyser={analyser} isActive={!isMicMuted} /></div>
              <div className="pt-2 border-t border-gray-500/10"><WalletConnectButton /></div>
            </GlassPanel>
          </div>
        )}

        {/* 3. ANA SAHNE */}
        <GlassPanel isDarkMode={isDarkMode} className="flex-1 flex flex-col relative overflow-hidden">
          {activeTab === 'feed' ? (
            <div className="flex-1 flex flex-col bg-transparent">
              <header className={`h-16 border-b border-gray-500/10 flex items-center justify-between px-8 shrink-0`}>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Akış</h1>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition">Paylaşım Yap</button>
              </header>
              <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-6">
                {posts.map(post => (
                  <div key={post.id} className={`${isDarkMode ? 'bg-white/5' : 'bg-white'} border border-gray-500/10 rounded-3xl p-6 shadow-sm`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-lg">{post.user.charAt(0)}</div>
                      <div><div className="font-bold">{post.user}</div><div className="text-xs text-gray-500">2 saat önce</div></div>
                    </div>
                    <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{post.content}</p>
                    <div className="flex gap-6 text-gray-400 text-sm font-medium">
                      <button className="flex items-center gap-2 hover:text-red-500 transition"><Heart size={18} /> {post.likes}</button>
                      <button className="flex items-center gap-2 hover:text-indigo-500 transition"><MessageSquare size={18} /> {post.comments}</button>
                      <button className="flex items-center gap-2 hover:text-green-500 transition ml-auto"><Share2 size={18} /> Paylaş</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <header className="h-14 border-b border-gray-500/10 flex items-center justify-between px-6 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                  {activeTab === 'chat' ? <Hash className="text-gray-400" /> : <Volume2 className="text-indigo-400" />}
                  <span className="font-bold text-lg">{activeChannel ? activeChannel.name : 'Kanal Seçin'}</span>
                </div>
                <div className="flex items-center gap-4">
                  {activeTab === 'spatial' && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/20 animate-pulse">● CANLI</span>}
                  <Users onClick={() => setShowMembers(!showMembers)} className={`cursor-pointer transition ${showMembers ? 'text-indigo-500' : 'text-gray-400'}`} />
                </div>
              </header>

              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col relative">
                  {activeTab === 'chat' ? (
                    <>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-end">
                        {activeChannel ? (
                          visibleMessages.length > 0 ? visibleMessages.map((m) => (
                            <div key={m.id} className="flex gap-4 group">
                              <div className={`w-10 h-10 rounded-2xl ${m.color} shrink-0 shadow-lg flex items-center justify-center font-bold text-white`}>{m.user.charAt(0)}</div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-bold ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{m.user}</span>
                                  <span className="text-[10px] bg-gray-500/20 px-1.5 rounded text-gray-500 font-bold">{m.role}</span>
                                  <span className="text-[10px] text-gray-500">{m.time}</span>
                                </div>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm leading-relaxed`}>{m.msg}</p>
                              </div>
                            </div>
                          )) : <div className="text-center text-gray-500 mt-10">Bu kanalda henüz mesaj yok.</div>
                        ) : <div className="text-center text-gray-500 mt-10">Bir kanal seçin.</div>}
                      </div>
                      <div className="p-6 pt-2 shrink-0">
                        <div className={`backdrop-blur-md rounded-2xl flex items-center p-1.5 border border-gray-500/10 focus-within:border-indigo-500/50 transition-all ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}>
                          <button className="p-3 text-gray-400 hover:text-indigo-500 transition"><Plus size={20} /></button>
                          <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={`#${activeChannel ? activeChannel.name : 'kanal'} kanalına mesaj gönder...`}
                            className={`flex-1 bg-transparent px-2 outline-none ${isDarkMode ? 'text-white' : 'text-black'} placeholder-gray-500`}
                            disabled={!activeChannelId}
                          />
                          <button onClick={handleSendMessage} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition"><Send size={18} /></button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`flex-1 ${isDarkMode ? 'bg-[#1a1b26]' : 'bg-white'} relative flex items-center justify-center overflow-hidden`}>
                      {spatialMode ? (
                        <>
                          <canvas ref={canvasRef} width={800} height={600} className="rounded-xl shadow-2xl border border-white/10" />
                          <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-white backdrop-blur-md">WASD ile hareket et</div>

                          {/* Radyo / Harita Değişim Butonları */}
                          <div className="absolute top-4 right-4 flex gap-2 bg-black/50 p-1 rounded-lg backdrop-blur-md">
                            <button onClick={() => setSpatialMode(false)} className={`p-2 rounded ${!spatialMode ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}><Radio size={16} /></button>
                            <button onClick={() => setSpatialMode(true)} className={`p-2 rounded ${spatialMode ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}><Map size={16} /></button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse"><Volume2 className="text-indigo-500" size={48} /></div>
                          <h2 className="text-2xl font-bold text-gray-500">Standart Ses Modu</h2>

                          {/* Radyo / Harita Değişim Butonları (Burada da görünsün) */}
                          <div className="flex justify-center gap-2 mt-4">
                            <button onClick={() => setSpatialMode(false)} className={`p-2 rounded ${!spatialMode ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}><Radio size={20} /></button>
                            <button onClick={() => setSpatialMode(true)} className={`p-2 rounded ${spatialMode ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}><Map size={20} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SAĞ ÜYE PANELİ */}
                {showMembers && (
                  <div className={`w-60 border-l border-gray-500/10 ${isDarkMode ? 'bg-black/20' : 'bg-gray-50/50'} flex flex-col p-4`}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Çevrimiçi — {members.length}</h3>
                    <div className="space-y-2">
                      {members.map(m => (
                        <div key={m.id} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-gray-500/10`}>
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-full ${m.avatarColor} flex items-center justify-center text-xs text-white font-bold`}>{m.name.charAt(0)}</div>
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 bg-green-500`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{m.name}</div>
                            <div className="text-[10px] text-gray-500">{m.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </GlassPanel>

      </div>
    </div>
  );
}

// --- YARDIMCI BİLEŞENLER ---
const GlassPanel = ({ children, className, onClick, isDarkMode }: any) => (
  <div
    onClick={onClick}
    className={`backdrop-blur-xl border rounded-3xl shadow-xl overflow-hidden ${isDarkMode
        ? 'bg-[#11131f]/60 border-white/5'
        : 'bg-white/70 border-gray-200'
      } ${className}`}
  >
    {children}
  </div>
);

const ChannelItem = ({ name, type, active, onClick, tag, onDelete, isDarkMode }: any) => (
  <div onClick={onClick} className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
    {type === 'text' ? <Hash size={16} /> : <Volume2 size={16} />}
    <span className="flex-1 truncate font-medium text-sm">{name}</span>
    {tag && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded shadow-lg shadow-red-500/20">{tag}</span>}
    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition"><Trash2 size={14} /></button>
  </div>
);

export default App;