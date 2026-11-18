'use client';

import { useMemo, useState } from 'react';
import { Activity, ArrowRight, Cable, CheckCircle2, Info, Moon, Network, RotateCcw, Sun, Waves, Zap } from 'lucide-react';

type Tab = 'topology' | 'splitter' | 'standard';
type Mode = 'fbt' | 'plc';

const fbtRatios = [
  { label: '1% / 99%', drop: 1, pass: 99 },
  { label: '5% / 95%', drop: 5, pass: 95 },
  { label: '10% / 90%', drop: 10, pass: 90 },
  { label: '15% / 85%', drop: 15, pass: 85 },
  { label: '20% / 80%', drop: 20, pass: 80 },
];
const plcOptions = [
  { label: 'PLC 1:2', ports: 2, loss: 3.7 },
  { label: 'PLC 1:4', ports: 4, loss: 7.4 },
  { label: 'PLC 1:8', ports: 8, loss: 10.7 },
  { label: 'PLC 1:16', ports: 16, loss: 14.0 },
  { label: 'PLC 1:32', ports: 32, loss: 17.3 },
];
const fmt = (n: number) => `${n.toFixed(2).replace('.', ',')} dBm`;
const fbtLoss = (percent: number, excess: number) => -10 * Math.log10(percent / 100) + excess;

function rxState(rx: number) {
  if (rx > -8) return { label: 'OVERLOAD', color: 'red', detail: 'Daya terlalu tinggi. Periksa kelas optik dan spesifikasi ONT.' };
  if (rx >= -23 && rx <= -15) return { label: 'SANGAT BAIK', color: 'green', detail: 'Daya terima berada pada rentang sangat baik menurut acuan ini.' };
  if (rx >= -26 && rx <= -24) return { label: 'KRITIS', color: 'yellow', detail: 'Sinyal masih mungkin bekerja, tetapi perlu pemeriksaan jalur.' };
  if (rx < -27) return { label: 'LOS / DI BAWAH BATAS', color: 'red', detail: 'Daya berada di bawah batas acuan penerima.' };
  return { label: 'DI LUAR RENTANG TARGET', color: 'yellow', detail: 'Nilai ini tidak masuk kategori target pada acuan ringkas. Cocokkan dengan datasheet ONT.' };
}

export default function Home() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState<Tab>('splitter');
  const [mode, setMode] = useState<Mode>('fbt');
  const [inputPower, setInputPower] = useState('3.5');
  const [fbtIndex, setFbtIndex] = useState(2);
  const [plcPorts, setPlcPorts] = useState(8);

  const power = Number(inputPower);
  const validPower = inputPower.trim() !== '' && Number.isFinite(power);
  const selectedFbt = fbtRatios[fbtIndex];
  const selectedPlc = plcOptions.find(p => p.ports === plcPorts) ?? plcOptions[2];
  const results = useMemo(() => {
    if (!validPower) return null;
    if (mode === 'plc') {
      const rx = power - selectedPlc.loss;
      return { dropLoss: selectedPlc.loss, passLoss: 0, dropRx: rx, passRx: null as number | null, state: rxState(rx) };
    }
    const dl = fbtLoss(selectedFbt.drop, 0.5);
    const pl = fbtLoss(selectedFbt.pass, 0.11);
    const rx = power - dl - selectedPlc.loss;
    return { dropLoss: dl, passLoss: pl, dropRx: rx, passRx: power - pl, state: rxState(rx) };
  }, [validPower, power, mode, selectedFbt, selectedPlc]);

  const recommendation = useMemo(() => {
    if (!validPower) return null;

    const candidates = fbtRatios.map((r, i) => {
      const rx = power - fbtLoss(r.drop, 0.5) - selectedPlc.loss;
      return { ...r, index: i, rx };
    }).filter(candidate => candidate.rx >= -22 && candidate.rx <= -18);

    return candidates.sort(
      (a, b) => Math.abs(a.rx - (-20)) - Math.abs(b.rx - (-20))
    )[0] ?? null;
  }, [validPower, power, selectedPlc]);

  const applyRecommendation = () => {
    if (recommendation) { setFbtIndex(recommendation.index); setMode('fbt'); }
  };
  const reset = () => { setInputPower('3.5'); setFbtIndex(2); setPlcPorts(8); setMode('fbt'); };

  return <main className={dark ? 'app dark' : 'app light'}>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Waves size={20}/></div><div><b>PON<span>CALC</span></b><small>FTTH & PON TOOLS</small></div></div>
      <div className="top-actions"><span className="version-pill">FTTH & PON Tools · v1.0</span><button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Ganti tema">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button></div>
    </header>

    <div className="shell">
      <section className="hero panel">
        <div><div className="eyebrow"><Zap size={13}/> PON CALCULATOR</div><h1>Kalkulator Splitter PON</h1><p>Simulasi pembagian daya optik FBT dan PLC untuk jaringan FTTH.</p></div>
        <div className="tabs" role="tablist">
          <button className={tab === 'topology' ? 'active' : ''} onClick={() => setTab('topology')}><Network size={15}/> Topologi</button>
          <button className={tab === 'splitter' ? 'active' : ''} onClick={() => setTab('splitter')}><Activity size={15}/> Splitter Pintar</button>
          <button className={tab === 'standard' ? 'active' : ''} onClick={() => setTab('standard')}><Info size={15}/> Standar Rx</button>
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card"><span className="summary-icon"><Network size={17}/></span><div><small>JENIS PERHITUNGAN</small><b>{mode === 'fbt' ? 'FBT + PLC' : 'PLC'}</b></div></div>
        <div className="summary-card"><span className="summary-icon"><Cable size={17}/></span><div><small>SPLITTER PLC</small><b>{selectedPlc.label}</b></div></div>
        <div className="summary-card"><span className="summary-icon"><Zap size={17}/></span><div><small>DAYA INPUT</small><b>{validPower ? fmt(power) : 'Belum diisi'}</b></div></div>
      </section>

      {tab === 'splitter' && <section className="work-grid">
        <div className="panel input-panel">
          <div className="panel-heading"><div><span className="step">01 / INPUT</span><h2>Parameter Splitter</h2><p>Masukkan daya optik dari hasil pengukuran OPM.</p></div><button className="reset-btn" onClick={reset}><RotateCcw size={14}/> Reset</button></div>
          <label className="field"><span>Daya Input di Titik Tiang / ODP (dBm)</span><div className="input-wrap"><input type="number" step="0.01" value={inputPower} onChange={e => setInputPower(e.target.value)} placeholder="Contoh: 3,5"/><small>dBm</small></div><em>Daya optik hasil ukur OPM sebelum masuk splitter.</em></label>
          <div className="field"><span>Metode Pembagian</span><div className="segmented"><button className={mode === 'fbt' ? 'selected' : ''} onClick={() => setMode('fbt')}>FBT Drop / Pass + PLC</button><button className={mode === 'plc' ? 'selected' : ''} onClick={() => setMode('plc')}>PLC langsung</button></div></div>
          {mode === 'fbt' && <div className="field"><span>Rasio Splitter FBT (Drop / Pass)</span><div className="select-wrap"><select value={fbtIndex} onChange={e => setFbtIndex(Number(e.target.value))}>{fbtRatios.map((r,i) => <option value={i} key={r.label}>{r.label}</option>)}</select></div><em>Drop menuju pelanggan lokal, Pass diteruskan ke titik berikutnya.</em></div>}
          <div className="field"><span>Tipe Splitter ke Rumah Pelanggan</span><div className="select-wrap"><select value={plcPorts} onChange={e => setPlcPorts(Number(e.target.value))}>{plcOptions.map(p => <option value={p.ports} key={p.ports}>{p.label} · {p.ports} port</option>)}</select></div></div>
          <div className="note"><Info size={15}/> Panjang kabel, sambungan, konektor, dan redaman jalur belum dimasukkan pada tahap ini. Hasil adalah simulasi splitter saja.</div>
        </div>

        <div className="panel result-panel">
          <div className="panel-heading"><div><span className="step">02 / HASIL</span><h2>Hasil Perhitungan</h2><p>Hasil berubah otomatis saat input diubah.</p></div><span className="live"><i/> LIVE</span></div>
          {!results ? <div className="empty">Masukkan daya input yang valid untuk melihat hasil.</div> : <>
            <div className="recommend-card"><small>{mode === 'fbt' ? 'DAYA ESTIMASI DI KELUARAN DROP + PLC' : 'DAYA ESTIMASI DI KELUARAN PLC'}</small><strong>{fmt(results.dropRx)}</strong><div className={`rx-status ${results.state.color}`}>{results.state.label}</div><p>{results.state.detail}</p></div>
            <div className="result-list">
              {mode === 'fbt' ? <>
                <div><span>Loss FBT jalur Drop ({selectedFbt.drop}%)</span><b>{results.dropLoss.toFixed(2)} dB</b></div>
                <div><span>Loss FBT jalur Pass ({selectedFbt.pass}%)</span><b>{results.passLoss.toFixed(2)} dB</b></div>
                <div><span>Loss splitter {selectedPlc.label}</span><b>{selectedPlc.loss.toFixed(2)} dB</b></div>
                <div className="highlight"><span>Sisa daya jalur Pass</span><b>{fmt(results.passRx ?? 0)}</b></div>
              </> : <div><span>Loss splitter {selectedPlc.label}</span><b>{selectedPlc.loss.toFixed(2)} dB</b></div>}
            </div>
            {mode === 'fbt' && <div className="recommend-box"><div><small>REKOMENDASI RASIO FBT UNTUK TARGET -18 s/d -22 dBm</small><b>{recommendation?.label ?? 'Tidak ada rasio yang memenuhi target'}</b><span>{recommendation ? `Estimasi Rx: ${fmt(recommendation.rx)}` : 'Coba ubah daya input atau rasio PLC.'}</span></div><button onClick={applyRecommendation} disabled={!recommendation}>Gunakan rasio</button></div>}
          </>}
          <div className="disclaimer">Perkiraan berdasarkan nilai insertion loss tipikal. Gunakan datasheet splitter dan pengukuran OPM untuk keputusan lapangan.</div>
        </div>
      </section>}

      {tab === 'topology' && <section className="panel topology-panel">
        <div className="panel-heading"><div><span className="step">DIAGRAM JARINGAN</span><h2>Alur Pembagian PON</h2><p>Ilustrasi alur sinyal dari sumber menuju pelanggan.</p></div></div>
        <div className="topology-flow">
          <div className="node"><span className="node-icon"><Zap/></span><b>OLT / FEEDER</b><small>Input {validPower ? fmt(power) : '—'}</small></div><div className="flow-arrow"><ArrowRight/></div>
          {mode === 'fbt' && <><div className="node fbt"><span className="node-icon"><Waves/></span><b>FBT SPLITTER</b><small>{selectedFbt.label}</small><div className="branch-labels"><span>Drop {selectedFbt.drop}%</span><span>Pass {selectedFbt.pass}%</span></div></div><div className="flow-arrow"><ArrowRight/></div></>}
          <div className="node plc"><span className="node-icon"><Network/></span><b>{selectedPlc.label}</b><small>{selectedPlc.ports} output port</small></div><div className="flow-arrow"><ArrowRight/></div><div className="node ont"><span className="node-icon"><Activity/></span><b>ONT / PELANGGAN</b><small>{results ? fmt(results.dropRx) : '—'}</small></div>
        </div>
        <div className="topology-caption"><Info size={16}/> {mode === 'fbt' ? 'Jalur Drop masuk ke splitter PLC untuk dibagikan ke pelanggan. Jalur Pass diteruskan ke titik distribusi berikutnya.' : 'Splitter PLC membagi daya input secara merata ke seluruh port keluaran.'}</div>
      </section>}

      {tab === 'standard' && <section className="panel standards-panel">
        <div className="panel-heading"><div><span className="step">PANDUAN TEKNISI</span><h2>Standar Parameter Sinyal Rx ONT / ONU</h2><p>Kategori praktis untuk membaca daya terima optik.</p></div></div>
        <div className="standard-grid">
          <article className="standard-card good"><CheckCircle2/><small>SANGAT BAIK / NORMAL</small><strong>-15 s/d -23 dBm</strong><p>Rentang acuan operasional yang umum digunakan untuk instalasi FTTH.</p></article>
          <article className="standard-card warning"><Info/><small>KRITIS / WARNING</small><strong>-24 s/d -26 dBm</strong><p>Sinyal mulai lemah. Periksa konektor, tekukan kabel, sambungan, dan jalur distribusi.</p></article>
          <article className="standard-card danger"><Activity/><small>LOS / OVERLOAD</small><strong>&lt; -27 dBm atau &gt; -8 dBm</strong><p>Di bawah -27 dBm berisiko LOS; di atas -8 dBm berisiko overload. Cocokkan dengan datasheet ONT.</p></article>
        </div>
        <div className="standard-note"><Info size={16}/> Batas Rx dapat berbeda menurut kelas optik GPON/EPON dan model ONT. Gunakan datasheet perangkat sebagai acuan final.</div>
      </section>}

      <section className="panel reference-panel">
        <div className="panel-heading"><div><span className="step">REFERENSI KOMPONEN</span><h2>Perbedaan Splitter PLC dan FBT</h2></div></div>
        <div className="reference-grid"><div><b>PLC · Pembagian Merata</b><p>1:2, 1:4, 1:8, 1:16, 1:32. Membagi daya hampir merata ke semua port; cocok untuk distribusi bintang.</p></div><div><b>FBT · Drop / Pass</b><p>1/99, 5/95, 10/90, 15/85, 20/80. Membagi daya tidak merata untuk cabang lokal dan jalur estafet.</p></div></div>
      </section>
      <footer><span>PONCALC · FTTH & PON TOOLS</span><span>Versi 1.0 · Kalkulasi splitter</span></footer>
    </div>
  </main>;
}
