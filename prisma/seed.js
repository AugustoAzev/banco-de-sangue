import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando o Seed...')

  // LIMPEZA (Opcional)
  // await prisma.doacao.deleteMany()
  // await prisma.usuarioUnidade.deleteMany()
  // await prisma.doador.deleteMany()
  // await prisma.usuario.deleteMany()
  // await prisma.unidadeColeta.deleteMany()

  // CRIAR UNIDADES DE COLETA
  const unidadesDados = [
    { nome: 'Hemocentro Central', cnpj: '11.111.111/0001-01', end: 'Av. Sete de Setembro, 1000' },
    { nome: 'Unidade Zona Leste', cnpj: '22.222.222/0001-02', end: 'Rua Grande Circular, 500' },
    { nome: 'Posto de Coleta Shopping', cnpj: '33.333.333/0001-03', end: 'Av. Djalma Batista, 200' },
    { nome: 'Hospital Santa Júlia (Anexo)', cnpj: '44.444.444/0001-04', end: 'Rua Ramos Ferreira, 300' },
    { nome: 'Unidade Móvel Bus', cnpj: '55.555.555/0001-05', end: 'Itinerante' }
  ]

  const unidadesCriadas = []

  for (const u of unidadesDados) {
    const unidade = await prisma.unidadeColeta.create({
      data: {
        nome_fantasia: u.nome,
        cnpj: u.cnpj,
        endereco: u.end,
        email_unidade: `contato@${u.nome.replace(/\s+/g, '').toLowerCase()}.com`
      }
    })
    unidadesCriadas.push(unidade)
    console.log(`Unidade criada: ${u.nome}`)
  }

  // CRIAR USUÁRIOS
  const senhaPadraoHash = '123456_hash_seguro' 

  // Admin
  const admin = await prisma.usuario.create({
    data: {
      nome_completo: 'Wilian',
      email: 'admin@sistema.com',
      senha_hash: senhaPadraoHash,
      tipo: 'ADMINISTRADOR',
      cpf: '000.000.000-00',
      unidades_trabalho: {
        create: [
          { id_unidade: unidadesCriadas[0].id_unidade }, // Central
          { id_unidade: unidadesCriadas[1].id_unidade }  // ZL
        ]
      }
    }
  })

  // Atendente 1
  const atendente1 = await prisma.usuario.create({
    data: {
      nome_completo: 'Maria Enfermeira',
      email: 'maria@sistema.com',
      senha_hash: senhaPadraoHash,
      tipo: 'ATENDENTE',
      cpf: '111.111.111-11',
      unidades_trabalho: {
        create: [{ id_unidade: unidadesCriadas[0].id_unidade }] 
      }
    }
  })

  // Atendente 2
  const atendente2 = await prisma.usuario.create({
    data: {
      nome_completo: 'João Técnico',
      email: 'joao@sistema.com',
      senha_hash: senhaPadraoHash,
      tipo: 'ATENDENTE',
      cpf: '222.222.222-22',
      unidades_trabalho: {
        create: [{ id_unidade: unidadesCriadas[2].id_unidade }] 
      }
    }
  })

  console.log(`Usuários criados: Admin, Maria e João.`)

  // CRIAR 10 DOADORES
  const doadoresDados = [
    { nome: 'Carlos Silva', tipo: 'A_POSITIVO', cpf: '100.000.000-01' },
    { nome: 'Ana Souza', tipo: 'O_POSITIVO', cpf: '100.000.000-02' },
    { nome: 'Pedro Santos', tipo: 'B_NEGATIVO', cpf: '100.000.000-03' },
    { nome: 'Julia Oliveira', tipo: 'AB_POSITIVO', cpf: '100.000.000-04' },
    { nome: 'Marcos Lima', tipo: 'O_NEGATIVO', cpf: '100.000.000-05' }, 
    { nome: 'Fernanda Costa', tipo: 'A_NEGATIVO', cpf: '100.000.000-06' },
    { nome: 'Lucas Pereira', tipo: 'B_POSITIVO', cpf: '100.000.000-07' },
    { nome: 'Beatriz Alves', tipo: 'AB_NEGATIVO', cpf: '100.000.000-08' },
    { nome: 'Ricardo Gomes', tipo: 'O_POSITIVO', cpf: '100.000.000-09' },
    { nome: 'Amanda Rocha', tipo: 'A_POSITIVO', cpf: '100.000.000-10' },
  ]

  console.log('Registrando Doadores e Doações...')

  for (let i = 0; i < doadoresDados.length; i++) {
    const d = doadoresDados[i]
    
    // Cria o doador
    const doador = await prisma.doador.create({
      data: {
        nome_completo: d.nome,
        cpf: d.cpf,
        tipo_sanguineo: d.tipo,
        idade: 20 + i, 
        email: `${d.nome.split(' ')[0].toLowerCase()}@gmail.com`
      }
    })

    // Cria uma doação
    const unidadeDestino = unidadesCriadas[i % 5] 
    const registrador = (i % 2 === 0) ? atendente1 : atendente2 

    await prisma.doacao.create({
      data: {
        volume_ml: 450.0,
        tipo_sanguineo_coletado: d.tipo,
        status: 'EM_ESTOQUE',
        observacoes: 'Coleta realizada com sucesso.',
        id_doador: doador.id_doador,
        id_registrador: registrador.id_usuario, 
        id_unidade: unidadeDestino.id_unidade
      }
    })
  }

  console.log('SEED FINALIZADO!')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})