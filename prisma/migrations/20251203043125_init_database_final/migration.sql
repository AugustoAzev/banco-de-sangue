-- CreateIndex
CREATE INDEX `Doador_cpf_idx` ON `Doador`(`cpf`);

-- CreateIndex
CREATE INDEX `UnidadeColeta_cnpj_idx` ON `UnidadeColeta`(`cnpj`);

-- CreateIndex
CREATE INDEX `Usuario_email_idx` ON `Usuario`(`email`);

-- CreateIndex
CREATE INDEX `Usuario_cpf_idx` ON `Usuario`(`cpf`);

-- RenameIndex
ALTER TABLE `doacao` RENAME INDEX `Doacao_id_unidade_fkey` TO `Doacao_id_unidade_idx`;
