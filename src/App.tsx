import React, { useState, useEffect, useRef } from 'react';
import {
  Server, Hash, Volume2, Settings, Mic, MicOff, Headphones,
  EarOff, Send, Plus, Trash2, Sun, Moon, Users,
  MoreVertical, Heart, MessageSquare, Share2, Map, Radio, Loader2
} from 'lucide-react';
import { WalletConnectButton } from './components/ui/WalletConnectButton';
import { ProfileModal } from './components/ProfileModal';
import { VoiceVisualizer } from './components/ui/VoiceVisualizer';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { LoginScreen } from './components/LoginScreen';
import { CreateServerModal, ServerSettingsModal } from './components/ServerModals';
import { supabase } from './lib/supabaseClient';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'chat' | 'spatial' | 'feed'>('chat');
  const [activeServerId, setActiveServerId] = useState<number>(0);
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [showMembers, setShowMembers] = useState(true);
  const [currentUser, setCurrentUser] = useState("Misafir");
  const [loading, setLoading] = useState(false);

  // Veriler
  const [servers, setServers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // MULTIPLAYER STATE (YENİ!)
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const channelRef = useRef<any>(null); // Kanal bağlantısını tutar

  // Modallar
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isCreateServerOpen, setCreateServerOpen] = useState(false);
  const [isServerSettingsOpen, setServerSettingsOpen] = useState(false);

  // Medya
  const [isMicMuted, setMicMuted] = useState(false);
  const [isDeafened, setDeafened] = useState(false);
  const [spatialMode, setSpatialMode] = useState(true);

  // --- SUPABASE BAŞLANGIÇ ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const initData = async () => {
      setLoading(true);
      await supabase.auth.signInAnonymously();

      // 1. Sunucuları Çek
      const { data: serverData } = await supabase.from('servers').select('*').order('id', { ascending: true });
      if (serverData && serverData.length > 0) {
        setServers(serverData);
        setActiveServerId(prev => prev === 0 ? serverData[0].id : prev);
      }

      // 2. Kanalları Çek
      const { data: channelData } = await supabase.from('channels').select('*').order('id', { ascending: true });
      if (channelData) setChannels(channelData);

      setLoading(false);
    };

    initData();

    const sub = supabase.channel('public:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, payload => {
        if (payload.eventType === 'INSERT') setServers(prev => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, payload => {
        if (payload.eventType === 'INSERT') {
          setChannels(prev => {
            if (prev.find(c => c.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
        if (payload.eventType === 'DELETE') setChannels(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [isLoggedIn]);

  // --- MULTIPLAYER MOTORU (REALTIME PRESENCE) ---
  const [pos, setPos] = useState({ x: 300, y: 200 });

  // 1. Odaya Bağlan ve Diğerlerini Dinle
  useEffect(() => {
    if (activeTab !== 'spatial' || !activeChannelId) return;

    // Kanal ismini benzersiz yap (Room ID)
    const channel = supabase.channel(`room:${activeChannelId}`, {
      config: {
        presence: {
          key: currentUser, // Beni bu isimle takip et
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users: any = {};
        // Gelen veriyi işle
        for (const key in newState) {
          if (key !== currentUser) { // Kendimizi tekrar çizmemize gerek yok
            // En son gelen konum bilgisini al
            users[key] = newState[key][0];
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Bağlanınca ilk konumumuzu gönderelim
          await channel.track({
            x: pos.x,
            y: pos.y,
            username: currentUser,
            color: '#4f46e5'
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeTab, activeChannelId]); // Sadece oda değişince çalışır

  // 2. Hareket Edince Konumu Yayınla
  useEffect(() => {
    if (channelRef.current && activeTab === 'spatial') {
      // Her hareketimizde yeni konumu gönderiyoruz
      // Not: Gerçek bir oyunda bunu "Throttle" (yavaşlatma) ile yapmak gerekir ama demo için sorun yok.
      channelRef.current.track({
        x: pos.x,
        y: pos.y,
        username: currentUser,
        color: '#4f46e5'
      });
    }
  }, [pos]);


  // --- MESAJLARI YÖNET ---
  useEffect(() => {
    if (!activeChannelId) return;

    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('channel_id', activeChannelId).order('created_at', { ascending: true });
      if (data) setMessages(data);
      else setMessages([]);
    };
    fetchMessages();

    const msgSub = supabase.channel(`messages:${activeChannelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannelId}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(msgSub); };
  }, [activeChannelId]);

  // --- MANTIK ---
  const visibleChannels = channels.filter(c => c.server_id === activeServerId);

  useEffect(() => {
    if (visibleChannels.length > 0 && !visibleChannels.find(c => c.id === activeChannelId)) {
      const first = visibleChannels.find(c => c.type === 'text');
      if (first) {
        setActiveChannelId(first.id);
        setActiveTab('chat');
      } else {
        setActiveChannelId(null);
      }
    }
  }, [activeServerId, channels]);


  // --- İŞLEVLER ---
  const handleCreateServer = async (name: string, type: string) => {
    const { data: server, error } = await supabase
      .from('servers')
      .insert({ name, icon: name.charAt(0).toUpperCase(), type })
      .select()
      .single();

    if (error) { alert("Hata: " + error.message); return; }

    if (server) {
      setServers(prev => [...prev, server]);
      const { data: newChannels } = await supabase.from('channels').insert([
        { name: "genel", type: "text", server_id: server.id },
        { name: "Meydan", type: "voice", server_id: server.id }
      ]).select();

      if (newChannels) setChannels(prev => [...prev, ...newChannels]);
      setActiveServerId(server.id);
    }
  };

  const handleAddChannel = async (type: string) => {
    const name = prompt(`${type === 'text' ? 'Metin' : 'Ses'} Kanalı Adı:`);
    if (name) {
      const { data, error } = await supabase.from('channels').insert({ name, type, server_id: activeServerId }).select().single();
      if (data) {
        setChannels(prev => [...prev, data]);
        setActiveChannelId(data.id);
        if (type === 'text') setActiveTab('chat'); else setActiveTab('spatial');
      }
    }
  };

  const handleDeleteChannel = async (id: number) => {
    if (confirm("Kanalı silmek istiyor musun?")) {
      await supabase.from('channels').delete().eq('id', id);
      setChannels(prev => prev.filter(c => c.id !== id));
      if (activeChannelId === id) setActiveChannelId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChannelId) return;
    const { error } = await supabase.from('messages').insert({ content: inputText, channel_id: activeChannelId, username: currentUser });
    if (error) alert("Hata: " + error.message);
    else setInputText("");
  };

  // --- KANAL TIKLAMA ---
  const handleChannelClick = (channel: any) => {
    setActiveChannelId(channel.id);
    if (channel.type === 'text') setActiveTab('chat');
    else setActiveTab('spatial');
  }

  // --- DİĞER BİLEŞENLER ---
  const [inputText, setInputText] = useState("");
  const { analyser } = useAudioProcessor();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas Çizim (GÜNCELLENDİ)
  useEffect(() => {
    if (activeTab === 'spatial' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const bgColor = isDarkMode ? '#1a1b26' : '#f3f4f6';
        const gridColor = isDarkMode ? '#333' : '#e5e7eb';

        // 1. Zemini Temizle
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, 800, 600);

        // 2. Izgarayı Çiz
        ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
        for (let i = 0; i < 800; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke(); }
        for (let i = 0; i < 600; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }

        // 3. DİĞER OYUNCULARI Çiz (Multiplayer)
        Object.values(onlineUsers).forEach((user: any) => {
          ctx.fillStyle = '#10b981'; // Yeşil (Başkası)
          ctx.beginPath(); ctx.arc(user.x, user.y, 20, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = isDarkMode ? 'white' : 'black';
          ctx.font = '12px Arial';
          ctx.fillText(user.username, user.x - 15, user.y - 25);
        });

        // 4. SENİ Çiz
        ctx.fillStyle = '#4f46e5'; // İndigo (Sen)
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isDarkMode ? 'white' : 'black';
        ctx.font = '12px Arial';
        ctx.fillText(currentUser, pos.x - 15, pos.y - 25);
      }
    }
  }, [pos, activeTab, isDarkMode, currentUser, onlineUsers]); // onlineUsers değişince de çiz

  // Tuş Hareketi
  useEffect(() => {
    if (activeTab === 'spatial') {
      const move = (e: KeyboardEvent) => {
        if (e.key === 'w') setPos(p => ({ ...p, y: p.y - 10 }));
        if (e.key === 's') setPos(p => ({ ...p, y: p.y + 10 }));
        if (e.key === 'a') setPos(p => ({ ...p, x: p.x - 10 }));
        if (e.key === 'd') setPos(p => ({ ...p, x: p.x + 10 }));
      };
      window.addEventListener('keydown', move);
      return () => window.removeEventListener('keydown', move);
    }
  }, [activeTab]);

  const theme = isDarkMode ? { bg: "bg-[#030712]", text: "text-gray-100" } : { bg: "bg-gray-100", text: "text-gray-900" };

  if (!isLoggedIn) return <LoginScreen onLogin={() => {
    const name = prompt("Kullanıcı Adın:", "Misafir");
    setCurrentUser(name || "Misafir");
    setIsLoggedIn(true);
  }} />;

  return (
    <div className={`h-screen w-screen ${theme.bg} flex items-center justify-center p-4 overflow-hidden relative font-sans ${theme.text}`}>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
      <CreateServerModal isOpen={isCreateServerOpen} onClose={() => setCreateServerOpen(false)} onCreate={handleCreateServer} />
      <ServerSettingsModal isOpen={isServerSettingsOpen} onClose={() => setServerSettingsOpen(false)} server={servers.find(s => s.id === activeServerId)} />

      <div className="flex w-full h-full max-w-[1600px] gap-4 relative z-10">

        {/* 1. SOL SÜTUN */}
        <div className="w-[72px] flex flex-col gap-3 shrink-0">
          <GlassPanel isDarkMode={isDarkMode} className="h-14 bg-indigo-600 flex items-center justify-center cursor-pointer" onClick={() => setActiveTab('feed')}><span className="font-bold text-xl text-white">A</span></GlassPanel>
          <div className="w-full h-[2px] bg-gray-500/20 rounded-full"></div>
          {servers.map(s => (
            <GlassPanel key={s.id} isDarkMode={isDarkMode} onClick={() => setActiveServerId(s.id)} className={`h-[72px] flex items-center justify-center cursor-pointer transition-all border-l-4 ${activeServerId === s.id ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-400'}`}>
              <span className="font-bold text-lg">{s.icon}</span>
            </GlassPanel>
          ))}
          <GlassPanel isDarkMode={isDarkMode} onClick={() => setCreateServerOpen(true)} className="h-12 flex items-center justify-center cursor-pointer text-green-500 hover:text-green-400 transition-all"><Plus /></GlassPanel>
          <div className="mt-auto flex flex-col gap-2">
            <GlassPanel isDarkMode={isDarkMode} onClick={() => setIsDarkMode(!isDarkMode)} className="h-12 flex items-center justify-center cursor-pointer text-yellow-500 hover:text-yellow-400 transition-all">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</GlassPanel>
            <GlassPanel isDarkMode={isDarkMode} onClick={() => setProfileOpen(true)} className="h-12 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-500 transition-all"><Settings size={20} /></GlassPanel>
          </div>
        </div>

        {/* 2. ORTA SÜTUN */}
        {activeTab !== 'feed' && (
          <div className="w-64 flex flex-col gap-4 shrink-0 animate-in slide-in-from-left-4 duration-300">
            <GlassPanel isDarkMode={isDarkMode} className="flex-1 p-3 flex flex-col">
              <header className="h-12 flex items-center justify-between px-2 font-bold text-lg border-b border-gray-500/10 mb-4">
                <span className="truncate">{servers.find(s => s.id === activeServerId)?.name || 'Sunucu'}</span>
                <MoreVertical size={16} className="cursor-pointer text-gray-500 hover:text-white" onClick={() => setServerSettingsOpen(true)} />
              </header>

              {loading ? (
                <div className="flex items-center justify-center h-32 text-gray-500"><Loader2 className="animate-spin mr-2" /> Yükleniyor...</div>
              ) : (
                <div className="space-y-6 overflow-y-auto custom-scrollbar">
                  <div>
                    <div className="flex items-center justify-between px-2 mb-2"><h3 className="text-[10px] font-bold text-gray-500 uppercase">Metin</h3><Plus size={12} className="cursor-pointer text-gray-500 hover:text-indigo-500" onClick={() => handleAddChannel('text')} /></div>
                    {visibleChannels.filter(c => c.type === 'text').map(c => (
                      <ChannelItem key={c.id} name={c.name} type="text" active={activeChannelId === c.id} onDelete={() => handleDeleteChannel(c.id)} onClick={() => handleChannelClick(c)} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between px-2 mb-2"><h3 className="text-[10px] font-bold text-gray-500 uppercase">Ses</h3><Plus size={12} className="cursor-pointer text-gray-500 hover:text-indigo-500" onClick={() => handleAddChannel('voice')} /></div>
                    {visibleChannels.filter(c => c.type === 'voice').map(c => (
                      <ChannelItem key={c.id} name={c.name} type="voice" active={activeChannelId === c.id} onDelete={() => handleDeleteChannel(c.id)} onClick={() => handleChannelClick(c)} tag={c.name.includes('Meydan') ? 'CANLI' : ''} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                </div>
              )}
            </GlassPanel>

            <GlassPanel isDarkMode={isDarkMode} className="h-auto p-3 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg" onClick={() => setProfileOpen(true)}>
                  <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">{currentUser.charAt(0)}</div>
                  <div className="text-sm font-bold">{currentUser}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setMicMuted(!isMicMuted)} className="p-1.5">{isMicMuted ? <MicOff size={16} color="red" /> : <Mic size={16} />}</button>
                  <button onClick={() => setDeafened(!isDeafened)} className="p-1.5">{isDeafened ? <EarOff size={16} color="red" /> : <Headphones size={16} />}</button>
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
            <div className="flex-1 flex items-center justify-center text-2xl font-bold text-gray-500">Akış Sayfası (Demo)</div>
          ) : (
            <>
              <header className="h-14 border-b border-gray-500/10 flex items-center justify-between px-6 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                  {activeTab === 'chat' ? <Hash className="text-gray-400" /> : <Volume2 className="text-indigo-400" />}
                  <span className="font-bold text-lg">{channels.find(c => c.id === activeChannelId)?.name || 'Kanal Seçin'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Users onClick={() => setShowMembers(!showMembers)} className="cursor-pointer text-gray-400" />
                </div>
              </header>

              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col relative">
                  {activeTab === 'chat' ? (
                    <>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
                        {activeChannelId ? (
                          messages.length > 0 ? messages.map((m) => (
                            <div key={m.id} className="flex gap-4 group animate-in slide-in-from-left-2">
                              <div className={`w-10 h-10 rounded-2xl bg-indigo-500 shrink-0 flex items-center justify-center font-bold text-white`}>{m.username?.charAt(0) || '?'}</div>
                              <div>
                                <div className="flex items-center gap-2 mb-1"><span className="font-bold">{m.username}</span><span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                <p className="text-gray-300 text-sm">{m.content}</p>
                              </div>
                            </div>
                          )) : <div className="text-center text-gray-500 mt-10">Bu kanalda henüz mesaj yok. İlk sen yaz!</div>
                        ) : <div className="text-center text-gray-500 mt-10">Bir kanal seçin.</div>}
                      </div>
                      <div className="p-6 pt-2 shrink-0">
                        <div className={`rounded-2xl flex items-center p-1.5 border border-gray-500/10 ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}>
                          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Mesaj gönder..." className="flex-1 bg-transparent px-2 outline-none" disabled={!activeChannelId} />
                          <button onClick={handleSendMessage} className="p-2 bg-indigo-600 text-white rounded-xl"><Send size={18} /></button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`flex-1 ${isDarkMode ? 'bg-[#1a1b26]' : 'bg-white'} relative flex items-center justify-center overflow-hidden`}>
                      {spatialMode ? (
                        <>
                          <canvas ref={canvasRef} width={800} height={600} className="rounded-xl shadow-2xl border border-white/10" />
                          <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-white backdrop-blur-md">WASD ile hareket et</div>
                        </>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse"><Volume2 className="text-indigo-500" size={48} /></div>
                          <h2 className="text-2xl font-bold text-gray-500">Standart Ses Modu</h2>
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

// --- BİLEŞENLER ---
const GlassPanel = ({ children, className, onClick, isDarkMode }: any) => (
  <div onClick={onClick} className={`backdrop-blur-xl ${isDarkMode ? 'bg-[#11131f]/60 border-white/5' : 'bg-white/70 border-gray-200'} border rounded-3xl shadow-xl overflow-hidden ${className}`}>{children}</div>
);

const ChannelItem = ({ name, type, active, onClick, tag, onDelete, isDarkMode }: any) => (
  <div onClick={onClick} className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
    {type === 'text' ? <Hash size={16} /> : <Volume2 size={16} />}
    <span className="flex-1 truncate font-medium text-sm">{name}</span>
    {tag && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">{tag}</span>}
    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500"><Trash2 size={14} /></button>
  </div>
);

export default App;