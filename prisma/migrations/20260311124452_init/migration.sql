-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstablishmentType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "EstablishmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "website" TEXT,
    "onisepUrl" TEXT,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationLevel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "FormationLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormationDomain" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "FormationDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT,
    "rncpCode" TEXT,
    "onisepUrl" TEXT,
    "levelId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "jobTarget" TEXT,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metier" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT,
    "family" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "level" TEXT,

    CONSTRAINT "Metier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetierFormation" (
    "id" TEXT NOT NULL,
    "metierId" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,

    CONSTRAINT "MetierFormation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstablishmentFormation" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,

    CONSTRAINT "EstablishmentFormation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EstablishmentType_slug_key" ON "EstablishmentType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_slug_key" ON "Establishment"("slug");

-- CreateIndex
CREATE INDEX "Establishment_typeId_idx" ON "Establishment"("typeId");

-- CreateIndex
CREATE INDEX "Establishment_regionId_idx" ON "Establishment"("regionId");

-- CreateIndex
CREATE INDEX "Establishment_city_idx" ON "Establishment"("city");

-- CreateIndex
CREATE UNIQUE INDEX "FormationLevel_slug_key" ON "FormationLevel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FormationDomain_slug_key" ON "FormationDomain"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Formation_slug_key" ON "Formation"("slug");

-- CreateIndex
CREATE INDEX "Formation_levelId_idx" ON "Formation"("levelId");

-- CreateIndex
CREATE INDEX "Formation_domainId_idx" ON "Formation"("domainId");

-- CreateIndex
CREATE INDEX "Formation_rncpCode_idx" ON "Formation"("rncpCode");

-- CreateIndex
CREATE UNIQUE INDEX "Metier_slug_key" ON "Metier"("slug");

-- CreateIndex
CREATE INDEX "Metier_family_idx" ON "Metier"("family");

-- CreateIndex
CREATE INDEX "Metier_source_idx" ON "Metier"("source");

-- CreateIndex
CREATE INDEX "MetierFormation_metierId_idx" ON "MetierFormation"("metierId");

-- CreateIndex
CREATE INDEX "MetierFormation_formationId_idx" ON "MetierFormation"("formationId");

-- CreateIndex
CREATE UNIQUE INDEX "MetierFormation_metierId_formationId_key" ON "MetierFormation"("metierId", "formationId");

-- CreateIndex
CREATE INDEX "EstablishmentFormation_establishmentId_idx" ON "EstablishmentFormation"("establishmentId");

-- CreateIndex
CREATE INDEX "EstablishmentFormation_formationId_idx" ON "EstablishmentFormation"("formationId");

-- CreateIndex
CREATE UNIQUE INDEX "EstablishmentFormation_establishmentId_formationId_key" ON "EstablishmentFormation"("establishmentId", "formationId");

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "EstablishmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "FormationLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "FormationDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetierFormation" ADD CONSTRAINT "MetierFormation_metierId_fkey" FOREIGN KEY ("metierId") REFERENCES "Metier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetierFormation" ADD CONSTRAINT "MetierFormation_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstablishmentFormation" ADD CONSTRAINT "EstablishmentFormation_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstablishmentFormation" ADD CONSTRAINT "EstablishmentFormation_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
