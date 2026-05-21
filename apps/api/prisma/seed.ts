import { PrismaClient, Role, Priority, Category, TicketStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const DEMO_PASSWORD = 'demo-helpdesk-2026';
const HOURS_AGO = (h: number) => new Date(Date.now() - h * 3600 * 1000);

async function main() {
  console.log('Nettoyage des données existantes...');
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  console.log('Création des utilisateurs...');
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [marie, thomas, sophie, karim, lea] = await Promise.all([
    prisma.user.create({ data: { name: 'Marie Garnier',  email: 'm.garnier@microsoft-solutions.fr',  password: hashed, role: Role.ADMIN } }),
    prisma.user.create({ data: { name: 'Thomas Lefèvre', email: 't.lefevre@microsoft-solutions.fr',  password: hashed, role: Role.ADMIN } }),
    prisma.user.create({ data: { name: 'Sophie Bonnet',  email: 's.bonnet@microsoft-solutions.fr',   password: hashed, role: Role.TECHNICIAN } }),
    prisma.user.create({ data: { name: 'Karim Belkacem', email: 'k.belkacem@microsoft-solutions.fr', password: hashed, role: Role.TECHNICIAN } }),
    prisma.user.create({ data: { name: 'Léa Moreau',     email: 'l.moreau@microsoft-solutions.fr',   password: hashed, role: Role.TECHNICIAN } }),
  ]);

  console.log('Création des tickets...');
  const tickets = await Promise.all([
    prisma.ticket.create({ data: {
      title: "Serveur de fichiers inaccessible depuis l'agence Villeurbanne",
      description: "Depuis ce matin 8h30, plus aucun poste de l'agence Villeurbanne ne peut accéder au partage \\\\srv-fichiers01\\Commun. Les autres agences ne sont pas affectées. Le serveur répond au ping mais le service SMB semble figé. Impact : 12 collaborateurs bloqués.",
      client: 'Cabinet Mercier & Associés', priority: Priority.CRITICAL, category: Category.NETWORK,
      status: TicketStatus.IN_PROGRESS, assignedToId: sophie.id, createdById: marie.id,
      createdAt: HOURS_AGO(54), updatedAt: HOURS_AGO(2),
    }}),
    prisma.ticket.create({ data: {
      title: 'Demande de migration boîte mail vers Microsoft 365',
      description: 'Suite à notre échange, nous souhaitons planifier la migration des 18 boîtes mail Zimbra vers Microsoft 365 Business Standard. Merci de nous proposer un créneau d\'intervention dans la quinzaine.',
      client: 'Boulangerie Artisanale Dupré', priority: Priority.MEDIUM, category: Category.SOFTWARE,
      status: TicketStatus.ON_HOLD, assignedToId: karim.id, createdById: marie.id,
      createdAt: HOURS_AGO(96), updatedAt: HOURS_AGO(24),
    }}),
    prisma.ticket.create({ data: {
      title: 'Imprimante multifonction Konica C308 ne scanne plus vers le réseau',
      description: "L'impression fonctionne, le scan vers USB également, mais le scan vers le dossier réseau remonte une erreur d'authentification depuis la mise à jour Windows du 14 mai.",
      client: 'Optique Rivière', priority: Priority.HIGH, category: Category.HARDWARE,
      status: TicketStatus.OPEN, createdById: thomas.id,
      createdAt: HOURS_AGO(60), updatedAt: HOURS_AGO(60),
    }}),
    prisma.ticket.create({ data: {
      title: 'Alerte antivirus répétée sur le poste comptabilité',
      description: "L'antivirus Bitdefender du poste de Mme Lacroix (comptabilité) déclenche plusieurs alertes par jour sur un même fichier en quarantaine. Comportement à vérifier — possiblement un faux positif lié au logiciel comptable EBP.",
      client: 'Garage Central Auto', priority: Priority.HIGH, category: Category.SECURITY,
      status: TicketStatus.IN_PROGRESS, assignedToId: lea.id, createdById: marie.id,
      createdAt: HOURS_AGO(20), updatedAt: HOURS_AGO(3),
    }}),
    prisma.ticket.create({ data: {
      title: 'Installation poste de travail nouvel arrivant',
      description: "Préparation d'un poste fixe Dell OptiPlex pour notre nouvel assistant administratif qui arrive le 27 mai. Office, accès AD, mail, profil VPN, accès logiciel métier Sage.",
      client: 'Études Notariales Pradel', priority: Priority.MEDIUM, category: Category.HARDWARE,
      status: TicketStatus.OPEN, createdById: thomas.id,
      createdAt: HOURS_AGO(8), updatedAt: HOURS_AGO(8),
    }}),
    prisma.ticket.create({ data: {
      title: 'Wifi instable salle de réunion (déconnexions intempestives)',
      description: "Le point d'accès Ubiquiti de la grande salle de réunion déconnecte les clients toutes les 5 à 10 minutes. Le souci a démarré la semaine dernière, sans changement de configuration connu.",
      client: 'Cabinet Mercier & Associés', priority: Priority.MEDIUM, category: Category.NETWORK,
      status: TicketStatus.RESOLVED, assignedToId: sophie.id, createdById: marie.id,
      createdAt: HOURS_AGO(120), updatedAt: HOURS_AGO(36),
    }}),
    prisma.ticket.create({ data: {
      title: 'Mot de passe administrateur local oublié',
      description: "Le DSI nous demande de réinitialiser le mot de passe administrateur local sur le poste de direction. Le compte AD fonctionne, c'est uniquement l'admin local qui pose problème.",
      client: 'Fromagerie des Monts', priority: Priority.LOW, category: Category.SECURITY,
      status: TicketStatus.CLOSED, assignedToId: karim.id, createdById: thomas.id,
      createdAt: HOURS_AGO(168), updatedAt: HOURS_AGO(72),
    }}),
    prisma.ticket.create({ data: {
      title: 'Erreur 0x80070005 lors de la sauvegarde Veeam quotidienne',
      description: "Depuis 3 nuits, la sauvegarde Veeam du serveur principal échoue avec une erreur d'accès refusé. Le compte de service n'a pas été modifié à notre connaissance.",
      client: 'Optique Rivière', priority: Priority.HIGH, category: Category.SOFTWARE,
      status: TicketStatus.IN_PROGRESS, assignedToId: lea.id, createdById: marie.id,
      createdAt: HOURS_AGO(72), updatedAt: HOURS_AGO(5),
    }}),
    prisma.ticket.create({ data: {
      title: 'Demande de devis switch 24 ports PoE+',
      description: "Suite à l'extension de nos locaux, besoin d'un nouveau switch Netgear ou Cisco 24 ports PoE+. Merci de nous transmettre un devis avec installation.",
      client: 'Boulangerie Artisanale Dupré', priority: Priority.LOW, category: Category.OTHER,
      status: TicketStatus.OPEN, createdById: thomas.id,
      createdAt: HOURS_AGO(4), updatedAt: HOURS_AGO(4),
    }}),
    prisma.ticket.create({ data: {
      title: 'VPN inopérant depuis le domicile du gérant',
      description: 'Le gérant ne parvient plus à se connecter au VPN OpenVPN depuis chez lui. Le client affiche "TLS handshake failed". Fonctionnait il y a une semaine.',
      client: 'Garage Central Auto', priority: Priority.CRITICAL, category: Category.NETWORK,
      status: TicketStatus.OPEN, createdById: marie.id,
      createdAt: HOURS_AGO(50), updatedAt: HOURS_AGO(50),
    }}),
  ]);

  console.log('Création des commentaires...');
  const [tk0, , , tk3, , tk5, , tk7] = tickets;

  await Promise.all([
    // TK-2041 — 3 commentaires
    prisma.comment.create({ data: { content: "J'ai prévenu le client par téléphone, ils ont mis en place un fallback temporaire vers le NAS de secours.", ticketId: tk0.id, authorId: marie.id, createdAt: HOURS_AGO(50) }}),
    prisma.comment.create({ data: { content: "Premier diagnostic : le service Server (lanmanserver) est figé sur le serveur. Redémarrage du service tenté sans effet. Je planifie un reboot maintenance ce soir 19h.", ticketId: tk0.id, authorId: sophie.id, createdAt: HOURS_AGO(48) }}),
    prisma.comment.create({ data: { content: "Reboot effectué. Le partage est revenu en ligne pendant 2h puis a re-figé. Probable saturation mémoire — j'ouvre un ticket constructeur en parallèle.", ticketId: tk0.id, authorId: sophie.id, createdAt: HOURS_AGO(2) }}),
    // TK-2044 — 2 commentaires
    prisma.comment.create({ data: { content: "Récupéré le hash du fichier en quarantaine. Lookup sur VirusTotal : 0/72 détections. Très probablement un faux positif lié à un .dll signé par EBP.", ticketId: tk3.id, authorId: lea.id, createdAt: HOURS_AGO(12) }}),
    prisma.comment.create({ data: { content: "Exclusion ajoutée dans la console Bitdefender. À surveiller sur 48h.", ticketId: tk3.id, authorId: lea.id, createdAt: HOURS_AGO(3) }}),
    // TK-2046 — 2 commentaires
    prisma.comment.create({ data: { content: "Channel WiFi modifié de 6 à 11 (saturation 2.4GHz du voisinage). Firmware UAP-AC mis à jour vers 6.5.28.", ticketId: tk5.id, authorId: sophie.id, createdAt: HOURS_AGO(40) }}),
    prisma.comment.create({ data: { content: "Validation côté client : plus de déconnexion depuis 24h. Je passe en Résolu, fermeture à confirmer la semaine prochaine.", ticketId: tk5.id, authorId: sophie.id, createdAt: HOURS_AGO(36) }}),
    // TK-2048 — 1 commentaire
    prisma.comment.create({ data: { content: "Le compte de service apparaît verrouillé dans l'AD. Reset du mot de passe en cours, nouvelle tentative cette nuit.", ticketId: tk7.id, authorId: lea.id, createdAt: HOURS_AGO(5) }}),
  ]);

  console.log('✅ Seed terminé avec succès.');
  console.log(`   → 5 utilisateurs, 10 tickets, 8 commentaires créés.`);
  console.log(`   → Mot de passe de démo : ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
