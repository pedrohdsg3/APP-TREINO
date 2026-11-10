// Entrada com conta Google e ligação do perfil à conta.
import { useEffect, useState } from 'react';
import { PLANOS } from '../data/planos';
import { type Perfil } from '../lib/perfis';
import { entrarComEmail, entrarComGoogle, redefinirSenha, lerPerfilNuvem, perfilDaConta, perfilDaNuvem, perfisSemConta, vincular, type Conta } from '../lib/conta';
import { listarPerfis } from '../lib/perfis';
import { Botao } from '../ui/Componentes';
import { AvatarPerfil } from '../ui/Personagem';
import { NovoPerfil } from './EscolherPerfil';

const msgErro = (e: unknown) => {
  const code = (e as { code?: string }).code ?? '';
  if (code === 'auth/network-request-failed' || !navigator.onLine) return 'Sem internet. Conecte-se para entrar.';
  if (code === 'auth/unauthorized-domain') return 'Este endereço não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados).';
  if (code === 'auth/operation-not-allowed') return 'Esse tipo de login ainda não foi ativado no Firebase (Authentication → Método de login).';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-login-credentials') return 'E-mail ou senha incorretos.';
  if (code === 'auth/email-already-in-use') return 'Já existe uma conta com esse e-mail. Toque em "Já tenho conta" para entrar.';
  if (code === 'auth/invalid-email') return 'E-mail inválido. Confira se digitou certo.';
  if (code === 'auth/weak-password') return 'Senha fraca: use pelo menos 6 caracteres.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
  if (code === 'auth/missing-password') return 'Digite a senha.';
  if (code === 'permission-denied' || /permission/i.test(String(e))) return 'A nuvem recusou o acesso. Publique as regras novas do Firestore.';
  return `Não foi possível entrar (${code || (e as Error).message}).`;
};

export function TelaLogin({ aoEntrar, aoSemConta }: { aoEntrar: (c: Conta) => void; aoSemConta: () => void }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modo, setModo] = useState<'inicio' | 'entrar' | 'criar'>('inicio');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [ver, setVer] = useState(false);

  async function tentar(f: () => Promise<Conta | null>) {
    setOcupado(true); setErro(null); setAviso(null);
    try { const c = await f(); if (c) aoEntrar(c); } catch (e) { setErro(msgErro(e)); } finally { setOcupado(false); }
  }
  const trocar = (m: typeof modo) => { setModo(m); setErro(null); setAviso(null); setSenha(''); setSenha2(''); };
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const podeEnviar = emailOk && senha.length >= 6 && (modo === 'entrar' || senha === senha2);

  if (modo !== 'inicio') {
    return (
      <div className="escolher">
        <form className="escolher__corpo entra" id="form-email" onSubmit={(e) => { e.preventDefault(); if (podeEnviar && !ocupado) void tentar(() => entrarComEmail(email, senha, modo === 'criar')); }}>
          <button type="button" className="link escolher__voltar" onClick={() => trocar('inicio')}>‹ Voltar</button>
          <h1 className="escolher__titulo">{modo === 'criar' ? 'Criar conta' : 'Entrar com e-mail'}</h1>
          <label className="campo"><span>E-mail</span>
            <input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com" autoFocus />
          </label>
          <label className="campo"><span>Senha {modo === 'criar' && '(mínimo 6 caracteres)'}</span>
            <input type={ver ? 'text' : 'password'} autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} value={senha} onChange={(e) => setSenha(e.target.value)} />
          </label>
          {modo === 'criar' && (
            <label className="campo"><span>Repita a senha</span>
              <input type={ver ? 'text' : 'password'} autoComplete="new-password" value={senha2} onChange={(e) => setSenha2(e.target.value)} />
            </label>
          )}
          <label className="login__ver"><input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} /> Mostrar senha</label>
          {modo === 'criar' && senha2 && senha !== senha2 && <p className="aviso-campo">As senhas não são iguais.</p>}
          {erro && <p className="aviso-campo" role="alert">{erro}</p>}
          {aviso && <p className="login__ok" role="status">{aviso}</p>}
          {modo === 'entrar' ? (
            <>
              <button type="button" className="link" disabled={ocupado} onClick={async () => {
                if (!emailOk) { setErro('Digite o seu e-mail acima para receber o link.'); return; }
                setOcupado(true); setErro(null);
                try { await redefinirSenha(email); setAviso(`Enviamos um e-mail para ${email.trim()} com o link para criar uma senha nova (confira o spam).`); }
                catch (e) { setErro(msgErro(e)); } finally { setOcupado(false); }
              }}>Esqueci minha senha</button>
              <button type="button" className="link" onClick={() => trocar('criar')}>Não tenho conta — criar agora</button>
            </>
          ) : <button type="button" className="link" onClick={() => trocar('entrar')}>Já tenho conta — entrar</button>}
        </form>
        <div className="guiado__rodape">
          <Botao grande type="submit" form="form-email" disabled={!podeEnviar || ocupado}>{ocupado ? 'Aguarde…' : modo === 'criar' ? 'Criar conta' : 'Entrar'}</Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="escolher">
      <div className="escolher__corpo entra login">
        <p className="rotulo-sup">Treino · 12 semanas</p>
        <div className="login__dupla" aria-hidden="true">
          <AvatarPerfil personagem="pedro" emoji="💪" tamanho={96} acao="aceno" />
          <AvatarPerfil personagem="yana" emoji="🌸" tamanho={96} acao="aceno" />
        </div>
        <h1 className="escolher__titulo">Entre na sua conta</h1>
        <p className="login__texto">Seus treinos ficam salvos na nuvem e aparecem em qualquer aparelho — celular, tablet ou computador. Cada conta só vê os próprios dados.</p>
        {erro && <p className="aviso-campo" role="alert">{erro}</p>}
      </div>
      <div className="guiado__rodape">
        <Botao grande disabled={ocupado} onClick={() => void tentar(entrarComGoogle)}><span className="g-logo" aria-hidden="true">G</span> {ocupado ? 'Entrando…' : 'Entrar com Google'}</Botao>
        <Botao grande variante="secundario" className="login__email" disabled={ocupado} onClick={() => trocar('entrar')}>✉️ Entrar com e-mail e senha</Botao>
        <button className="link" onClick={aoSemConta}>Usar sem conta (só neste aparelho)</button>
      </div>
    </div>
  );
}

/** Depois do login: encontra (ou cria) o perfil da conta neste aparelho. */
export function TelaVincular({ conta, aoPronto, aoSair }: { conta: Conta; aoPronto: (p: Perfil) => void; aoSair: () => void }) {
  const [fase, setFase] = useState<'buscando' | 'escolher' | 'criar' | 'erro'>('buscando');
  const [locais, setLocais] = useState<(Perfil & { treinos: number })[]>([]);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function buscar() {
    setFase('buscando');
    try {
      const ja = perfilDaConta(conta.uid);
      if (ja) return aoPronto(ja);
      const nuvem = await lerPerfilNuvem(conta.uid);
      if (nuvem) {
        // a conta já tem perfil: usa o deste aparelho com o mesmo id (juntando os treinos dele) ou cria um novo
        const mesmo = listarPerfis().find((p) => p.id === nuvem.id && !p.uid);
        return aoPronto(mesmo ? await vincular(conta, { ...mesmo, ...nuvem, banco: mesmo.banco }, { nuvemJaExiste: true }) : perfilDaNuvem(conta, nuvem));
      }
      setLocais(await perfisSemConta());
      setFase('escolher');
    } catch (e) { setErro(msgErro(e)); setFase('erro'); }
  }
  useEffect(() => { void buscar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (fase === 'criar') {
    return <NovoPerfil titulo="Criar meu perfil" aoVoltar={() => setFase('escolher')} aoCriar={async (p) => {
      try { aoPronto(await vincular(conta, p)); } catch (e) { setErro(msgErro(e)); setFase('erro'); }
    }} />;
  }

  return (
    <div className="escolher">
      <div className="escolher__corpo entra">
        <p className="rotulo-sup">{conta.email}</p>
        {fase === 'buscando' && <><h1 className="escolher__titulo">Carregando sua conta…</h1><div className="carregando" aria-hidden="true" /></>}
        {fase === 'erro' && (
          <>
            <h1 className="escolher__titulo">Ops</h1>
            <p className="aviso-campo" role="alert">{erro}</p>
            <Botao onClick={() => void buscar()}>Tentar de novo</Botao>
          </>
        )}
        {fase === 'escolher' && (
          <>
            <h1 className="escolher__titulo">{locais.length ? 'Qual perfil é seu?' : 'Bem-vindo(a)!'}</h1>
            <p className="login__texto">
              {locais.length
                ? 'Escolha o seu perfil deste aparelho: tudo o que já foi registrado nele vai para a sua conta. Os outros perfis continuam só aqui.'
                : 'Crie o seu perfil. Ele fica guardado na sua conta.'}
            </p>
            <div className="escolher__lista">
              {locais.map((p) => (
                <button key={p.id} className="jogador" disabled={ocupado} onClick={async () => {
                  setOcupado(true);
                  try { aoPronto(await vincular(conta, p)); } catch (e) { setErro(msgErro(e)); setFase('erro'); } finally { setOcupado(false); }
                }}>
                  <span className="jogador__avatar jogador__avatar--personagem" aria-hidden="true"><AvatarPerfil personagem={p.personagem} emoji={p.emoji} tamanho={64} acao="aceno" /></span>
                  <span className="jogador__info"><strong>Este é o meu: {p.nome}</strong><span>{PLANOS[p.plano]?.nome} · {p.treinos} {p.treinos === 1 ? 'registro' : 'registros'}</span></span>
                  <span className="jogador__seta" aria-hidden="true">›</span>
                </button>
              ))}
              <button className="jogador jogador--novo" onClick={() => setFase('criar')}>
                <span className="jogador__avatar" aria-hidden="true">＋</span>
                <span className="jogador__info"><strong>Criar um perfil novo</strong><span>Começar do zero</span></span>
              </button>
            </div>
          </>
        )}
        <button className="link escolher__conta" onClick={aoSair}>Usar outra conta</button>
      </div>
    </div>
  );
}

