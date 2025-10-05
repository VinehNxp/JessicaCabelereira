const BIN_ID = "68e1c85e43b1c97be95a9f9c";
const API_KEY = "$2a$10$mN.FYt5hgOqK2EIR9ybSsOMcCN5PF7yx2ics.mQ6140ImDLsJyzI6";
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

async function carregarDados() {
  try {
    const res = await fetch(BIN_URL + "/latest",{ headers:{"X-Master-Key":API_KEY}});
    const data = await res.json();
    return data.record || { produtos: [], servicos: [] };
  } catch(err){ console.error(err); return { produtos: [], servicos: [] }; }
}

async function salvarDados(dados) {
  try{
    await fetch(BIN_URL,{
      method:"PUT",
      headers:{"Content-Type":"application/json","X-Master-Key":API_KEY},
      body:JSON.stringify(dados)
    });
  } catch(err){ console.error(err); }
}

async function mostrarProdutos() {
  const dados = await carregarDados();
  const lista = document.getElementById("lista-produtos");
  lista.innerHTML = "";
  dados.produtos.forEach((p,i)=>{
    lista.innerHTML+=`<li class="item-admin">
      <img src="${p.imagem}" alt="${p.nome}" style="width:80px;border-radius:6px;">
      <span>${p.nome} - R$ ${p.preco}</span>
      <button onclick="removerProduto(${i})">Remover</button>
    </li>`;
  });
}

async function mostrarServicos() {
  const dados = await carregarDados();
  const lista = document.getElementById("lista-servicos");
  lista.innerHTML = "";
  dados.servicos.forEach((s,i)=>{
    lista.innerHTML+=`<li class="item-admin">
      <span>${s.nome} - R$ ${s.preco}</span>
      <button onclick="removerServico(${i})">Remover</button>
    </li>`;
  });
}

document.getElementById("form-produto").addEventListener("submit", async function(e){
  e.preventDefault();
  const nome = document.getElementById("produto-nome").value;
  const preco = parseFloat(document.getElementById("produto-preco").value);
  const imagemInput = document.getElementById("produto-imagem").files[0];
  if(!imagemInput) return;

  const reader = new FileReader();
  reader.onload = async function(event){
    let dados = await carregarDados();
    dados.produtos.push({ id:Date.now(), nome, preco, imagem:event.target.result });
    await salvarDados(dados);
    mostrarProdutos();
  };
  reader.readAsDataURL(imagemInput);
  this.reset();
  document.getElementById("preview-imagem").style.display="none";
});

async function removerProduto(index){
  let dados = await carregarDados();
  dados.produtos.splice(index,1);
  await salvarDados(dados);
  mostrarProdutos();
}

document.getElementById("form-servico").addEventListener("submit", async function(e){
  e.preventDefault();
  const nome = document.getElementById("servico-nome").value;
  const preco = parseFloat(document.getElementById("servico-preco").value);
  let dados = await carregarDados();
  dados.servicos.push({ id:Date.now(), nome, preco });
  await salvarDados(dados);
  mostrarServicos();
  this.reset();
});

async function removerServico(index){
  let dados = await carregarDados();
  dados.servicos.splice(index,1);
  await salvarDados(dados);
  mostrarServicos();
}

// Inicializar
mostrarProdutos();
mostrarServicos();
