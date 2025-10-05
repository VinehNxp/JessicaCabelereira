// =====================
// Configuração JSON Bin
// =====================
const BIN_ID = "68e1c85e43b1c97be95a9f9c";
const API_KEY = "$2a$10$mN.FYt5hgOqK2EIR9ybSsOMcCN5PF7yx2ics.mQ6140ImDLsJyzI6";
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const carrinho = [];
const carrinhoUl = document.querySelector("#carrinho ul");

// =====================
// Carregar dados
// =====================
async function carregarDados() {
  try {
    const res = await fetch(BIN_URL + "/latest", { headers: { "X-Master-Key": API_KEY }});
    const data = await res.json();
    return data.record || { produtos: [], servicos: [], agendamentos: [] };
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    return { produtos: [], servicos: [], agendamentos: [] };
  }
}

async function salvarDados(dados) {
  try {
    await fetch(BIN_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": API_KEY },
      body: JSON.stringify(dados)
    });
  } catch (err) { console.error("Erro ao salvar dados:", err); }
}

// =====================
// Carregar produtos e serviços
// =====================
async function carregarProdutosEServicos() {
  const data = await carregarDados();
  const produtosUl = document.querySelector("#lista-produtos");
  const servicosUl = document.querySelector("#lista-servicos");
  produtosUl.innerHTML = "";
  servicosUl.innerHTML = "";

  (data.produtos || []).forEach(prod => {
    const li = document.createElement("li");
    li.innerHTML = `<img src="${prod.imagem}" alt="${prod.nome}" onerror="this.onerror=null; this.src='imagem-nao-disponivel.png';">
                    <p>${prod.nome} - R$ ${prod.preco.toFixed(2)}</p>
                    <button class="adicionar-carrinho" data-tipo="produto" data-nome="${prod.nome}" data-preco="${prod.preco}">Adicionar</button>`;
    produtosUl.appendChild(li);
  });

  (data.servicos || []).forEach(serv => {
    const li = document.createElement("li");
    li.innerHTML = `<p>${serv.nome} - R$ ${serv.preco.toFixed(2)}</p>
                    <button class="adicionar-carrinho" data-tipo="servico" data-nome="${serv.nome}" data-preco="${serv.preco}">Adicionar</button>`;
    servicosUl.appendChild(li);
  });
}

carregarProdutosEServicos();

// =====================
// Carrinho
// =====================
document.body.addEventListener("click", e => {
  if (e.target.classList.contains("adicionar-carrinho")) {
    const nome = e.target.dataset.nome;
    const preco = parseFloat(e.target.dataset.preco);
    const tipo = e.target.dataset.tipo;
    const existente = carrinho.find(i => i.nome === nome && i.tipo === tipo);
    if (existente) existente.quantidade++;
    else carrinho.push({ nome, preco, quantidade: 1, tipo });
    atualizarCarrinho();
  }
});

function atualizarCarrinho() {
  carrinhoUl.innerHTML = "";
  let total = 0;
  if (carrinho.length === 0) { carrinhoUl.innerHTML = "<p>Seu carrinho está vazio.</p>"; }
  carrinho.forEach((item,index)=>{
    const li = document.createElement("li");
    li.innerHTML = `<span>${item.nome} - R$ ${item.preco.toFixed(2)}</span>
                    <div class="carrinho-quantidade">
                      <button class="menos">-</button>
                      <span>${item.quantidade}</span>
                      <button class="mais">+</button>
                    </div>
                    <button class="remover">X</button>`;
    li.querySelector(".mais").addEventListener("click", ()=>{ item.quantidade++; atualizarCarrinho(); });
    li.querySelector(".menos").addEventListener("click", ()=>{ if(item.quantidade>1)item.quantidade--;else carrinho.splice(index,1); atualizarCarrinho(); });
    li.querySelector(".remover").addEventListener("click", ()=>{ carrinho.splice(index,1); atualizarCarrinho(); });
    carrinhoUl.appendChild(li);
    total += item.preco*item.quantidade;
  });
  if(carrinho.length>0){
    const totalLi = document.createElement("li");
    totalLi.style.fontWeight="bold";
    totalLi.textContent = `Total: R$ ${total.toFixed(2)}`;
    carrinhoUl.appendChild(totalLi);
  }

  // Atualiza horários sempre que carrinho muda
  atualizarHorarios();
}

// =====================
// Limitar data mínima para amanhã
// =====================
const dataInput = document.getElementById("data");
const horaSelect = document.getElementById("hora");

const hoje = new Date();
hoje.setDate(hoje.getDate() + 1); // amanhã
const dia = String(hoje.getDate()).padStart(2, "0");
const mes = String(hoje.getMonth() + 1).padStart(2, "0");
const ano = hoje.getFullYear();
dataInput.min = `${ano}-${mes}-${dia}`;

// =====================
// Atualizar horários dinamicamente
// =====================
async function atualizarHorarios() {
  const dados = await carregarDados();
  const agendamentos = dados.agendamentos || [];
  const dataSelecionada = dataInput.value;
  if (!dataSelecionada) return;

  const temServicoNoCarrinho = carrinho.some(i => i.tipo === "servico");

  Array.from(horaSelect.options).forEach(opt => {
    if (temServicoNoCarrinho) {
      // Bloqueia horários ocupados por serviços
      const horariosOcupados = agendamentos
        .filter(a => a.data === dataSelecionada && a.servico)
        .map(a => a.hora);
      opt.disabled = horariosOcupados.includes(opt.value);
    } else {
      // Se só tiver produto, libera todos os horários
      opt.disabled = false;
    }
  });
}

dataInput.addEventListener("change", atualizarHorarios);

// =====================
// Agendamento e WhatsApp
// =====================
async function gerarMensagemWhatsApp() {
  const nomeCliente = document.querySelector("#nome").value || "Cliente";
  const data = dataInput.value;
  const hora = horaSelect.value;

  if(!data||!hora){ alert("Escolha data e horário!"); return; }

  const dados = await carregarDados();
  const agendamentos = dados.agendamentos || [];

  const servico = carrinho.find(i=>i.tipo==="servico");
  const produtos = carrinho.filter(i=>i.tipo==="produto");

  // Valida apenas se houver serviço
  if(servico && agendamentos.some(a=>a.data===data && a.hora===hora)){ 
    alert("Esse horário já está ocupado!"); 
    return; 
  }

  let mensagem = "";
  let total = 0;

  if(servico && produtos.length===0)
    mensagem = `Olá, sou ${nomeCliente} e gostaria de agendar ${servico.nome} para o dia ${data}, às ${hora}. Consegue?`;
  else if(servico && produtos.length>0){
    mensagem = `Olá, sou ${nomeCliente} e gostaria de agendar ${servico.nome} para o dia ${data}, às ${hora}. Consegue?\n\nProdutos:\n`;
    produtos.forEach(p=>{ mensagem+=`${p.quantidade} x ${p.nome}\n`; total+=p.preco*p.quantidade; });
    total += servico.preco;
    mensagem += `Total de R$ ${total.toFixed(2)}\n\nOs produtos vão ter em estoque?`;
  } else if(!servico && produtos.length>0){
    mensagem = `Olá, sou ${nomeCliente} e gostaria de:\n`;
    produtos.forEach(p=>{ mensagem+=`${p.quantidade} x ${p.nome}\n`; total+=p.preco*p.quantidade; });
    mensagem += `Total de R$ ${total.toFixed(2)}\n\nOs produtos vão ter em estoque?`;
  } else { alert("Nenhum serviço ou produto selecionado!"); return; }

  // Salvar agendamento somente se houver serviço
  if(servico){
    dados.agendamentos = [...agendamentos,{ nome: nomeCliente, data, hora, servico: servico?.nome || "", produtos }];
    await salvarDados(dados);
  }

  // Abrir WhatsApp
  const numero="5544991792301";
  const url=`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url,"_blank");

  // Reset
  document.querySelector("#agendamento form").reset();
  carrinho.length=0;
  atualizarCarrinho();
}

document.querySelector("#agendamento form").addEventListener("submit", e=>{
  e.preventDefault();
  gerarMensagemWhatsApp();
});

// =====================
// Login Admin
// =====================
const formLogin = document.querySelector("#form-login");
const loginErro = document.querySelector("#login-erro");
const ADMIN_EMAIL = "jessica@adm";
const ADMIN_SENHA = "jessica";

formLogin.addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.querySelector("#login-email").value;
  const senha = document.querySelector("#login-senha").value;
  if(email===ADMIN_EMAIL && senha===ADMIN_SENHA){
    window.location.href = "/pages/admin.html";
  } else { loginErro.style.display="block"; }
});

// =====================
// Registrar Service Worker (PWA)
// =====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado com sucesso!', reg))
      .catch(err => console.error('Falha ao registrar Service Worker:', err));
  });
}
