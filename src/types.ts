/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Resources {
  oil: number;
  steel: number;
  food: number;
}

export interface NationalAssets {
  gold: number;
  militaryPower: number;
  economicPower: number;
  resources: Resources;
  techLevel: number;
  factoryLevel: number;
  lastIncomeUpdate: number;
}

export interface Country {
  name: string;
  originalName: string;
  slogan: string;
  flagUrl: string;
  assets: NationalAssets;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  isAdmin: boolean;
  country: Country;
  equipmentSlots: string[]; // Active military equipment IDs (max 6)
  warehouse: Record<string, number>; // Equipment IDs stored in warehouse with quantities
  assetLog: { timestamp: string; gold: number; military: number; economy: number }[]; // History tracker for charts
  loan?: { amount: number; borrowedAt: number; repaid: boolean }; // IMF loan tracking
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'artillery' | 'air_defense' | 'navy' | 'special_forces' | 'missile' | 'drone' | 'ground_forces' | 'air_force' | 'nuclear';
  cost: number;
  militaryGained: number;
  airDefenseGained?: number;
  special?: string;
  minTech: number;
  isInvention?: boolean;
  inventorUsername?: string;
  inventorCountryName?: string;
  tags?: string[];
  sellPrice?: number;
  isForSale?: boolean;
  forSaleUntil?: string;
  description?: string;
}

export interface TradeOffer {
  id: string;
  senderId: string;
  senderCountry: string;
  receiverId: string;
  receiverCountry: string;
  offerGold: number;
  offerResources: Partial<Resources>;
  requestGold: number;
  requestResources: Partial<Resources>;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  timestamp: string;
}

export interface LoanProposal {
  loanAmount: number;
  interestRate: number;
  durationRounds: number;
  repaymentAmount: number;
}

export interface WarDeclarationResponse {
  valid: boolean;
  reason: string;
  tension_points: number;
}

export interface CasualtyReport {
  killed: number;
  wounded: number;
  civilians: number;
  aircraft_lost: number;
  tanks_lost: number;
  ships_lost: number;
}

export interface CombatRoundResponse {
  narrative: string;
  attacker_loss: number;
  defender_loss: number;
  attacker_economy_damage: number;
  defender_economy_damage: number;
  attacker_resource_loss: Resources;
  defender_resource_loss: Resources;
  attacker_casualties: CasualtyReport;
  defender_casualties: CasualtyReport;
  winner_advantage: 'attacker' | 'defender' | 'none';
  suggested_next_action: 'continue' | 'ceasefire';
  territory_conquered_percent?: number;
}

export interface WarReasonSubmission {
  id: string;
  attackerId: string;
  attackerCountry: string;
  defenderId: string;
  defenderCountry: string;
  casusBelli: string;
  valid: boolean;
  aiExplanation: string;
  tensionPoints: number;
  status: 'waiting_defender' | 'active' | 'ended' | 'ceasefire';
  defenderDefenseScenario?: string;
  pendingScenarios?: { attackerId?: string; defenderId?: string; attackerScenario?: string; defenderScenario?: string };
  rounds: {
    roundNumber: number;
    attackerScenario: string;
    defenderScenario: string;
    resolution: CombatRoundResponse;
    timestamp: string;
  }[];
  winnerId?: string;
  winnerChoice?: 'annex' | 'colonize' | 'tribute' | 'spare';
  resolution?: 'annex' | 'colonize' | 'tribute' | 'spare';
  peaceTermsNarrative?: string;
  nuclearLaunched?: string[];
  ceasefireProposedBy?: string;
  timestamp: string;
}

export interface UNProposal {
  id: string;
  title: string;
  description: string;
  actionType: 'ceasefire' | 'sanctions' | 'peacekeepers' | 'aid' | 'custom';
  targetUserId?: string;
  sourceUserId?: string;
  votesYes: string[];
  votesNo: string[];
  status: 'pending' | 'active' | 'approved' | 'rejected';
  createdAt: string;
  durationMs: number;
  adminNote?: string;
}

export interface Alliance {
  id: string;
  name: string;
  logoUrl: string;
  charter: string;
  leaderId: string;
  leaderCountry: string;
  members: {
    userId: string;
    countryName: string;
    militaryPower: number;
  }[];
  timestamp: string;
}

export interface GeminiLog {
  id: string;
  prompt: string;
  response: string;
  error?: string;
  timestamp: string;
}

export interface TweetComment {
  id: string;
  userId: string;
  username: string;
  countryName: string;
  flagUrl: string;
  text: string;
  timestamp: string;
  isVerified?: boolean;
}

export interface Tweet {
  id: string;
  userId: string;
  username: string;
  countryName: string;
  flagUrl: string;
  text: string;
  likes: string[];
  comments: TweetComment[];
  timestamp: string;
  isAiGenerated?: boolean;
  isVerified?: boolean;
}
