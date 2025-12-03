-- CreateTable
CREATE TABLE `UnidadeColeta` (
    `id_unidade` VARCHAR(191) NOT NULL,
    `nome_fantasia` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `email_unidade` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UnidadeColeta_cnpj_key`(`cnpj`),
    PRIMARY KEY (`id_unidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id_usuario` VARCHAR(191) NOT NULL,
    `nome_completo` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha_hash` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NULL,
    `pis` VARCHAR(191) NULL,
    `cargo` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `tipo` ENUM('ADMINISTRADOR', 'ATENDENTE') NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    UNIQUE INDEX `Usuario_cpf_key`(`cpf`),
    UNIQUE INDEX `Usuario_pis_key`(`pis`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario_unidade` (
    `id_usuario` VARCHAR(191) NOT NULL,
    `id_unidade` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id_usuario`, `id_unidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Doador` (
    `id_doador` VARCHAR(191) NOT NULL,
    `nome_completo` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NOT NULL,
    `idade` INTEGER NULL,
    `sexo` VARCHAR(191) NULL,
    `tipo_sanguineo` ENUM('A_POSITIVO', 'A_NEGATIVO', 'O_NEGATIVO') NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Doador_cpf_key`(`cpf`),
    PRIMARY KEY (`id_doador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Doacao` (
    `id_doacao` VARCHAR(191) NOT NULL,
    `data_doacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `volume_ml` DOUBLE NOT NULL,
    `observacoes` VARCHAR(191) NULL,
    `status` ENUM('EM_ESTOQUE', 'DESPACHADA', 'DESCARTADA') NOT NULL DEFAULT 'EM_ESTOQUE',
    `tipo_sanguineo_coletado` ENUM('A_POSITIVO', 'A_NEGATIVO', 'O_NEGATIVO') NOT NULL,
    `id_doador` VARCHAR(191) NOT NULL,
    `id_registrador` VARCHAR(191) NOT NULL,
    `id_unidade` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_doacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuario_unidade` ADD CONSTRAINT `usuario_unidade_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_unidade` ADD CONSTRAINT `usuario_unidade_id_unidade_fkey` FOREIGN KEY (`id_unidade`) REFERENCES `UnidadeColeta`(`id_unidade`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Doacao` ADD CONSTRAINT `Doacao_id_doador_fkey` FOREIGN KEY (`id_doador`) REFERENCES `Doador`(`id_doador`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Doacao` ADD CONSTRAINT `Doacao_id_registrador_fkey` FOREIGN KEY (`id_registrador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Doacao` ADD CONSTRAINT `Doacao_id_unidade_fkey` FOREIGN KEY (`id_unidade`) REFERENCES `UnidadeColeta`(`id_unidade`) ON DELETE RESTRICT ON UPDATE CASCADE;
