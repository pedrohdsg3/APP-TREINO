// Registrar outra atividade (basquete, vôlei…): no lugar da corrida do dia ou como extra.
import { useState } from 'react';
import { IMPACTO_ALTO, INTENSIDADES, MODALIDADES, infoModalidade } from '../data/atividades';
import { planoDaData } from '../engine/plano';
import { useConfigPrograma } from '../lib/ajustes';
import { salvarAtividade } from '../lib/historico';
import { dataPorExtenso, formatarData, isoLocal } from '../lib/datas';
import { Botao } from './Componentes';
import { Escala, textoDor } from './Escala';
import { Stepper } from './Stepper';

export function RegistrarAtividade({ dataInicial, aoSalvar, aoCancelar }: { dataInicial?: string; aoSalvar: (msg: string) => void; aoCancelar: () => void }) {
  const cfg = useConfigPrograma();
  const [data, setData] = useState(dataInicial ?? isoLocal());
  const [modalidade, setModalidade] = useState<string>('Basquete');
  const [outra, setOutra] = useState('');
  const [minutos, setMinutos] = useState(60);
  const [intensidade, setIntensidade] = useState<'leve' | 'moderada' | 'alta'>('alta');
  const [esforco, setEsforco] = useState<number | undefined>(8);
  const [dor, setDor] = useState<number | undefined>();
  const [notas, setNotas] = useState('');
  const [substituir, setSubstituir] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const plano = cfg ? planoDaData(cfg, data) : null;
  const diaDeCorrida = !!plano?.corrida && plano.corrida.tipo !== 'cardio' && !plano.descanso;
  const noLugar = substituir ?? diaDeCorrida;
  const nome = modalidade === 'Outra' ? outra.trim() : modalidade;
  const impacto = IMPACTO_ALTO.has(infoModalidade(nome).id);

  return (
    <div className="detalhe atividade">
      <h2 className="detalhe__titulo">Outra atividade</h2>
      <p className="detalhe__orientacao">O foco continua sendo a corrida, mas esportes também contam. Registre como foi.</p>

      <div className="campo">
        <span>Atividade</span>
        <div className="chips-sel">
          {[...MODALIDADES.map((m) => ({ nome: m.nome, emoji: m.emoji })), { nome: 'Outra', emoji: '🏅' }].map((m) => (
            <button key={m.nome} className={`chip-sel ${modalidade === m.nome ? 'on on--musc' : ''}`} aria-pressed={modalidade === m.nome} onClick={() => setModalidade(m.nome)}>
              {m.emoji} {m.nome}
            </button>
          ))}
        </div>
        {modalidade === 'Outra' && <input value={outra} onChange={(e) => setOutra(e.target.value)} placeholder="Qual atividade?" maxLength={30} aria-label="Nome da atividade" />}
      </div>

      <Stepper rotulo="Duração" sufixo="min" passo={5} valor={minutos} onChange={(v) => setMinutos(Math.max(5, Math.round(v)))} />

      <div className="campo">
        <span>Intensidade</span>
        <div className="intensidades" role="radiogroup" aria-label="Intensidade">
          {INTENSIDADES.map((i) => (
            <button key={i.id} role="radio" aria-checked={intensidade === i.id} className={`intensidade intensidade--${i.id} ${intensidade === i.id ? 'on' : ''}`}
              onClick={() => { setIntensidade(i.id); setEsforco(i.esforco); }}>
              <strong>{i.nome}</strong><small>{i.descricao}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <span>Esforço percebido (1–10)</span>
        <Escala de={1} ate={10} valor={esforco} onChange={setEsforco} rotulo="Esforço percebido" />
      </div>

      <div className="campo">
        <span>Dor no joelho (0–10){impacto ? ' · recomendado' : ' · opcional'}</span>
        <Escala de={0} ate={10} valor={dor} onChange={setDor} rotulo="Dor no joelho" tipo="dor" />
        {dor !== undefined && <small className="sutil">{textoDor(dor)}</small>}
        {impacto && dor === undefined && <small className="sutil">Saltos e mudanças de direção exigem do joelho: vale anotar.</small>}
      </div>
      {(dor ?? 0) >= 4 && (
        <p className="nota-cuidado">Dor 4 ou mais: amanhã prefira algo sem impacto (bike, elíptico ou caminhada) e, se a dor continuar, use a opção de recuar a corrida em Programa.</p>
      )}

      <label className="campo">
        <span>Dia · {dataPorExtenso(data)} ({formatarData(data)})</span>
        <input type="date" value={data} max={isoLocal()} onChange={(e) => { if (e.target.value) { setData(e.target.value); setSubstituir(null); } }} />
      </label>

      {diaDeCorrida ? (
        <button className="interruptor" role="switch" aria-checked={noLugar} onClick={() => setSubstituir(!noLugar)}>
          <span className="interruptor__texto">
            <strong>No lugar da corrida desse dia</strong>
            <small>{noLugar ? `Conta como o treino do dia (${plano!.corrida!.titulo}).` : 'Entra como atividade extra; a corrida continua pendente.'}</small>
          </span>
          <span className={`interruptor__chave ${noLugar ? 'on' : ''}`} aria-hidden="true"><i /></span>
        </button>
      ) : (
        <p className="sutil">Esse dia não é de corrida: a atividade entra como extra (conta na sequência e no Duelo).</p>
      )}

      <label className="campo">
        <span>Nota</span>
        <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ex.: 3 jogos, muitos saltos…" />
      </label>

      {erro && <p className="aviso-campo">{erro}</p>}
      <Botao grande cor="corr" disabled={salvando || !nome} onClick={async () => {
        setSalvando(true); setErro(null);
        try {
          await salvarAtividade({ data, modalidade: nome, duracaoMin: minutos, intensidade, esforco, dorJoelho: dor, notas, substituiuCorrida: diaDeCorrida && noLugar, semana: plano?.semana });
          aoSalvar(`${infoModalidade(nome).emoji} ${nome} registrado!`);
        } catch (e) {
          setErro(`Não consegui salvar: ${(e as Error).message}. Tente de novo.`);
          setSalvando(false);
        }
      }}>Salvar atividade ✅</Botao>
      <Botao variante="fantasma" onClick={aoCancelar}>Cancelar</Botao>
    </div>
  );
}
