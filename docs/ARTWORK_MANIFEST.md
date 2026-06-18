# Artwork Production Manifest — The Celtic Realm Living Atlas

Generated from live data. Reflects all current image slots in the application.

---

## Overview

| Category | Count | Path prefix |
|---|---|---|
| Character portraits | 78 | `/public/assets/characters/` |
| Story card artwork | 18 | `/public/assets/stories/` |
| Physical location panels | 24 | `/public/assets/<cycle>/` |
| Character / deity map panels | 17 | `/public/assets/<cycle>/` |
| Group / thematic panels | 7 | `/public/assets/<cycle>/` |
| **Total** | **144** | |

## File delivery

Drop files directly into the target path. The app picks them up on page reload — no code or JSON change required for location artwork. For character artwork, update `imageFile` in `src/data/characters.json` once the file is delivered. For story artwork, update `imageFile` in `src/data/stories-catalog.json`.

## Recommended sizes

| Type | Size | Ratio | Notes |
|---|---|---|---|
| Character portrait | 400 × 500 px minimum | 4:5 | Face or figure, portrait orientation |
| Story card | 600 × 380 px minimum | ~16:10 | Scene or symbol, landscape |
| Physical location | 800 × 500 px minimum | 16:10 | Photography or illustration |
| Map panel (character/group) | 600 × 400 px minimum | 3:2 | Atmospheric, fits square panel |

## Status values

`needed` · `generated` · `approved` · `installed`

---

## 1. MVP Priority (P0)

The minimum set for a compelling demo. Produce these first.
Ranked by story-beat frequency (how often the character/place appears across all 18 stories).

| Display Name | ID | Target filepath | Type | Cycle | Status | Notes |
|---|---|---|---|---|---|---|
| Cú Chulainn | `cu-chulainn` | `/public/assets/characters/cu-chulainn.webp` | character portrait | Ulster | needed | Appears in 31 beats — highest frequency |
| Fionn mac Cumhaill | `fionn-mac-cumhaill` | `/public/assets/characters/fionn-mac-cumhaill.webp` | character portrait | Fenian | needed | Appears in 24 beats |
| Lugh Lámhfhada | `lugh` | `/public/assets/characters/lugh.webp` | character portrait | Mythological | needed | Appears in 12 beats |
| Fionnuala | `fionnuala` | `/public/assets/characters/fionnuala.webp` | character portrait | Mythological | needed | Appears in 10 beats; swan form essential |
| Conchobar mac Nessa | `conchobar` | `/public/assets/characters/conchobar.webp` | character portrait | Ulster | needed | Appears in 10 beats |
| Oisín | `oisin` | `/public/assets/characters/oisin.webp` | character portrait | Fenian | needed | Appears in 9 beats |
| Deirdre | `deirdre` | `/public/assets/characters/deirdre.webp` | character portrait | Ulster | needed | Appears in 8 beats |
| Queen Medb | `medb` | `/public/assets/characters/medb.webp` | character portrait | Ulster | needed | Appears in 7 beats |
| Diarmuid Ua Duibhne | `diarmuid` | `/public/assets/characters/diarmuid.webp` | character portrait | Fenian | needed | Appears in 7 beats |
| Étaín | `etain` | `/public/assets/characters/etain.webp` | character portrait | Mythological | needed | Appears in 7 beats; fly/swan/woman |
| Brian mac Tuireann | `brian` | `/public/assets/characters/brian.webp` | character portrait | Mythological | needed | Appears in 7 beats |
| Bran mac Febal | `bran-mac-febal` | `/public/assets/characters/bran-mac-febal.webp` | character portrait | Mythological | needed | Appears in 7 beats |
| Gráinne | `grainne` | `/public/assets/characters/grainne.webp` | character portrait | Fenian | needed | Appears in 6 beats |
| Conaire Mór | `conaire-mor` | `/public/assets/characters/conaire-mor.webp` | character portrait | Ulster | needed | Appears in 6 beats |
| The Morrígan | `the-morrigan` | `/public/assets/characters/the-morrigan.webp` | character portrait | Ulster | needed | 4 beats but iconic — crow form |
| The Dagda | `dagda` | `/public/assets/characters/dagda.webp` | character portrait | Mythological | needed | Iconically strange — club, cauldron |
| Balor of the Evil Eye | `balor` | `/public/assets/characters/balor.webp` | character portrait | Mythological | needed | Single giant eye — visually distinctive |
| Lir | `lir` | `/public/assets/characters/lir.webp` | character portrait | Mythological | needed | Sea deity — Children of Lir |
| Hill of Tara | `tara` | `/public/assets/mythological/tara.webp` | location panel | Mythological | needed | Most referenced site in atlas |
| Emain Macha | `emain-macha` | `/public/assets/ulster/emain-macha.webp` | location panel | Ulster | needed | Ulster Cycle capital |
| Brú na Bóinne | `bru-na-boinne` | `/public/assets/mythological/bru-na-boinne.webp` | location panel | Mythological | needed | Newgrange — most visited Irish site |
| Ben Bulben | `ben-bulben` | `/public/assets/fenian/ben-bulben.webp` | location panel | Fenian | needed | Diarmuid's death; Yeats country |
| Lough Derravaragh | `lough-derravaragh` | `/public/assets/mythological/lough-derravaragh.webp` | location panel | Mythological | needed | Children of Lir — first transformation |
| River Boyne — Salmon | `boyne-salmon` | `/public/assets/fenian/boyne-salmon.webp` | location panel | Fenian | needed | Salmon of Knowledge |

---

## 2. Character Portraits (78 slots)

All drop into `/public/assets/characters/<id>.webp`. Once delivered, set `imageFile: "<id>.webp"` in `src/data/characters.json`.

### Mythological Cycle — 23

| Display Name | ID | Filename | Priority | Status | Notes |
|---|---|---|---|---|---|
| Lugh Lámhfhada | `lugh` | `lugh.webp` | P0 | needed | Sun-god iconography; long arm; spear |
| Nuada Airgetlám | `nuada` | `nuada.webp` | P1 | needed | Silver mechanical arm is the visual key |
| Balor of the Evil Eye | `balor` | `balor.webp` | P0 | needed | One giant eye held shut; monstrous scale |
| The Dagda | `dagda` | `dagda.webp` | P0 | needed | Large, club on wheels, cauldron; earthly |
| Bres mac Elatha | `bres` | `bres.webp` | P2 | needed | Beautiful but cruel; ambiguous |
| Dian Cécht | `dian-cecht` | `dian-cecht.webp` | P1 | needed | Physician; herbs; the healing spring |
| Goibniu | `goibniu` | `goibniu.webp` | P2 | needed | Divine smith at the forge |
| Manannán mac Lir | `manannan-mac-lir` | `manannan-mac-lir.webp` | P1 | needed | Sea chariot across waves; cloaked figure |
| Aonghus Óg | `aonghus-og` | `aonghus-og.webp` | P1 | needed | Young, birds around him; love deity |
| Midir | `midir` | `midir.webp` | P0 | needed | Otherworld lord; golden; chess piece |
| Lir | `lir` | `lir.webp` | P0 | needed | Sea deity; grieving father |
| Bodb Dearg | `bodb-dearg` | `bodb-dearg.webp` | P2 | needed | Red-haired king of the Tuatha Dé |
| Étaín | `etain` | `etain.webp` | P0 | needed | Woman/fly/swan; three forms possible |
| Fuamnach | `fuamnach` | `fuamnach.webp` | P1 | needed | Druidess with rowan rod |
| Eochaid Airem | `eochaid-airem` | `eochaid-airem.webp` | P2 | needed | Mortal High King; chess opponent |
| Brian mac Tuireann | `brian` | `brian.webp` | P0 | needed | Warrior; one of three brothers |
| Iuchar mac Tuireann | `iuchar` | `iuchar.webp` | P2 | needed | Second brother; trio composition possible |
| Iucharba mac Tuireann | `iucharba` | `iucharba.webp` | P2 | needed | Third brother; trio composition possible |
| Cian mac Dian Cécht | `cian` | `cian.webp` | P1 | needed | Warrior; pig transformation moment |
| Bran mac Febal | `bran-mac-febal` | `bran-mac-febal.webp` | P0 | needed | Voyager; boat; silver branch |
| Fionnuala | `fionnuala` | `fionnuala.webp` | P0 | needed | Swan — eldest; sheltering siblings |
| Aodh | `aodh` | `aodh.webp` | P2 | needed | Swan — second child |
| Fiachra | `fiachra` | `fiachra.webp` | P2 | needed | Swan — third child |
| Conn (son of Lir) | `conn-lir` | `conn-lir.webp` | P2 | needed | Swan — youngest |
| Aoife (of Lir) | `aoife-of-lir` | `aoife-of-lir.webp` | P1 | needed | Stepmother; druidess; guilt |
| Aoibh | `aoibh` | `aoibh.webp` | P2 | needed | First wife of Lir |
| Mochaomhóg | `mochaomhog` | `mochaomhog.webp` | P2 | needed | Monk; witness to transformation's end |

### Ulster Cycle — 30

| Display Name | ID | Filename | Priority | Status | Notes |
|---|---|---|---|---|---|
| Cú Chulainn | `cu-chulainn` | `cu-chulainn.webp` | P0 | needed | Warp-spasm; pillar stone; chariot — pick one dramatic moment |
| Medb | `medb` | `medb.webp` | P0 | needed | Queen; warrior; chariot; commanding |
| Ailill | `ailill` | `ailill.webp` | P2 | needed | King of Connacht; Medb's consort |
| The Morrígan | `the-morrigan` | `the-morrigan.webp` | P0 | needed | Crow; battlefield; ambiguous gender |
| Ferdia | `ferdia` | `ferdia.webp` | P1 | needed | Warrior at the ford; horn-skin |
| Conchobar mac Nessa | `conchobar` | `conchobar.webp` | P0 | needed | Ulster king; throne; calculating |
| Fergus mac Róich | `fergus-mac-roich` | `fergus-mac-roich.webp` | P1 | needed | Exiled champion; huge; sword |
| Dáire mac Fiachna | `daire` | `daire.webp` | P2 | needed | Owner of the Brown Bull |
| Mac Roth | `mac-roth` | `mac-roth.webp` | P2 | needed | Royal herald |
| Deirdre | `deirdre` | `deirdre.webp` | P0 | needed | Dark-haired; beauty that began a war |
| Naoise | `naoise` | `naoise.webp` | P1 | needed | Warrior; harper; exiled for love |
| Ardán | `ardan` | `ardan.webp` | P2 | needed | One of the three sons of Uisneach |
| Ainle | `ainle` | `ainle.webp` | P2 | needed | One of the three sons of Uisneach |
| Cathbad | `cathbad` | `cathbad.webp` | P1 | needed | Druid; prophecy; robes |
| Eoghan mac Durthacht | `eoghan-mac-durthacht` | `eoghan-mac-durthacht.webp` | P2 | needed | The betrayer |
| Feidlimid mac Daill | `feidlimid` | `feidlimid.webp` | P2 | needed | Harper; Deirdre's father |
| Deichtine | `deichtine` | `deichtine.webp` | P1 | needed | Cú Chulainn's mother; divine birth scene |
| Culann the Smith | `culann` | `culann.webp` | P1 | needed | Blacksmith; grieving; the dead hound |
| Scáthach | `scathach` | `scathach.webp` | P1 | needed | Warrior-woman; Isle of Skye; teacher |
| Emer | `emer` | `emer.webp` | P1 | needed | Resolute; intelligence not sentiment |
| Aoife (warrior) | `aoife-warrior` | `aoife-warrior.webp` | P1 | needed | Distinct from Aoife of Lir — fighter |
| Forgall Manach | `forgall-manach` | `forgall-manach.webp` | P2 | needed | Scheming father |
| Bricrú Nemthenga | `bricriu` | `bricriu.webp` | P1 | needed | Troublemaker; hall; speaking gallery |
| Conall Cernach | `conall-cernach` | `conall-cernach.webp` | P1 | needed | Champion; loyal; scarred |
| Lóegaire Búadach | `loegaire-buadach` | `loegaire-buadach.webp` | P2 | needed | Third champion; proud |
| Cú Roí mac Dáiri | `cu-roi` | `cu-roi.webp` | P1 | needed | Giant judge; grey-green; the beheading game |
| Lugaid mac Con Roí | `lugaid-mac-con-roi` | `lugaid-mac-con-roi.webp` | P1 | needed | The spear that killed Cú Chulainn |
| Conaire Mór | `conaire-mor` | `conaire-mor.webp` | P0 | needed | High King; the doomed good man |
| Mac Cécht | `mac-cecht` | `mac-cecht.webp` | P1 | needed | Last defender; water journey |
| Ingcél Cáech | `ingcel` | `ingcel.webp` | P2 | needed | One-eyed exile; observer |

### Fenian Cycle — 18

| Display Name | ID | Filename | Priority | Status | Notes |
|---|---|---|---|---|---|
| Fionn mac Cumhaill | `fionn-mac-cumhaill` | `fionn-mac-cumhaill.webp` | P0 | needed | White-haired; thumb to cheek; older figure |
| Oisín | `oisin` | `oisin.webp` | P0 | needed | Poet-warrior; aged when meeting Patrick |
| Diarmuid Ua Duibhne | `diarmuid` | `diarmuid.webp` | P0 | needed | Love spot; warrior; doomed |
| Gráinne | `grainne` | `grainne.webp` | P0 | needed | Fierce agency; not passive; royal |
| Cormac mac Airt | `cormac-mac-airt` | `cormac-mac-airt.webp` | P2 | needed | High King; Gráinne's father |
| Niamh of the Golden Hair | `niamh` | `niamh.webp` | P1 | needed | Otherworld; white horse; gold hair |
| St. Patrick | `st-patrick` | `st-patrick.webp` | P2 | needed | As depicted in the Acallam — curious, not dismissive |
| Finnegas | `finnegas` | `finnegas.webp` | P1 | needed | Old poet; the wait by the river |
| Oscar mac Oisín | `oscar` | `oscar.webp` | P1 | needed | Greatest warrior; death at Gabhair |
| Caoilte mac Rónáin | `caolite-mac-ronain` | `caolite-mac-ronain.webp` | P1 | needed | Swift; old survivor; storyteller |
| Goll mac Morna | `goll-mac-morna` | `goll-mac-morna.webp` | P1 | needed | One-eyed; old enemy become loyal captain |
| Daire Donn | `daire-donn` | `daire-donn.webp` | P1 | needed | King of the World; foreign fleet |
| Cairbre Lifeachair | `cairbre` | `cairbre.webp` | P1 | needed | High King who broke the Fianna |
| Cumhall mac Trénmhóir | `cumhall` | `cumhall.webp` | P1 | needed | Father; dies before story begins |
| Muirenn Muncháem | `muirenn` | `muirenn.webp` | P1 | needed | Mother giving child away; grief |
| Bodhmall | `bodhmall` | `bodhmall.webp` | P2 | needed | Druidess; forest; teacher |

---

## 3. Creature Portraits (5 slots)

Drop into `/public/assets/creatures/<id>.webp`.

| Display Name | ID | Filename | Priority | Status | Notes |
|---|---|---|---|---|---|
| The Salmon of Knowledge | `salmon-of-knowledge` | `salmon-of-knowledge.webp` | P1 | needed | Glowing; ancient; river Boyne setting |
| Donn Cúailnge (Brown Bull) | `donn-cuailnge` | `donn-cuailnge.webp` | P1 | needed | Massive; dark; supernatural presence |
| Finnbhennach (White Bull) | `finnbhennach` | `finnbhennach.webp` | P2 | needed | White; equally supernatural |
| The Boar of Ben Bulben | `boar-of-ben-bulben` | `boar-of-ben-bulben.webp` | P1 | needed | The boar that killed Diarmuid |
| Niamh's White Horse | `white-horse` | `white-horse.webp` | P2 | needed | The horse from Tír na nÓg |

---

## 4. Story Card Artwork (18 slots)

Drop into `/public/assets/stories/<id>.webp`. Once delivered, set `imageFile: "<id>.webp"` in `src/data/stories-catalog.json`.

| Display Name | ID | Filename | Cycle | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Táin Bó Cúailnge | `tain-bo-cuailnge` | `tain-bo-cuailnge.webp` | Ulster | P0 | needed | The two bulls; Medb's army; Cú Chulainn at the ford |
| Children of Lir | `children-of-lir` | `children-of-lir.webp` | Mythological | P0 | needed | Four swans on grey water |
| Deirdre | `deirdre` | `deirdre.webp` | Ulster | P0 | needed | Deirdre and Naoise; Alba; exile |
| Pursuit of Diarmuid | `pursuit-of-diarmuid` | `pursuit-of-diarmuid.webp` | Fenian | P0 | needed | The flight; fire; Gráinne's hand |
| Oisín in Tír na nÓg | `oisin` | `oisin.webp` | Fenian | P0 | needed | Niamh; white horse; western sea |
| Salmon of Knowledge | `salmon-of-knowledge` | `salmon-of-knowledge.webp` | Fenian | P0 | needed | The thumb; the fire; the river |
| Cath Maige Tuired | `cath-maige-tuired` | `cath-maige-tuired.webp` | Mythological | P1 | needed | Lugh's sling stone; Balor's eye |
| Tochmarc Étaíne | `tochmarc-etaine` | `tochmarc-etaine.webp` | Mythological | P1 | needed | Two swans through the roof of Tara |
| Children of Tuireann | `oidheadh-chlainne-tuireann` | `oidheadh-chlainne-tuireann.webp` | Mythological | P1 | needed | Three brothers; the world's edge |
| Voyage of Bran | `voyage-of-bran` | `voyage-of-bran.webp` | Mythological | P1 | needed | The western sea; Manannán's chariot |
| Naming of Cú Chulainn | `naming-of-cu-chulainn` | `naming-of-cu-chulainn.webp` | Ulster | P1 | needed | Boy with hurley; the dead hound |
| Wooing of Emer | `tochmarc-emire` | `tochmarc-emire.webp` | Ulster | P1 | needed | Scáthach's bridge; Skye |
| Bricrú's Feast | `fled-bricrenn` | `fled-bricrenn.webp` | Ulster | P1 | needed | The beheading game; the giant |
| Death of Cú Chulainn | `aided-con-culainn` | `aided-con-culainn.webp` | Ulster | P1 | needed | The pillar stone; the crow |
| Da Derga's Hostel | `togail-bruidne-da-derga` | `togail-bruidne-da-derga.webp` | Ulster | P1 | needed | Fire; night; the window |
| Battle of Ventry | `battle-of-ventry` | `battle-of-ventry.webp` | Fenian | P1 | needed | Ventry strand; fleet; single combat |
| Battle of Gabhair | `battle-of-gabhair` | `battle-of-gabhair.webp` | Fenian | P1 | needed | Fionn holding Oscar |
| Birth of Fionn | `birth-of-fionn` | `birth-of-fionn.webp` | Fenian | P1 | needed | Slieve Bloom; the child in the forest |

---

## 5. Physical Location Panels (24 slots)

Photography or illustration of actual Irish landscape and monuments.
Path: `/public/assets/<cycle>/<imageFile>`

### Mythological — 9 physical places

| Display Name | ID | Filename | Full path | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Hill of Tara | `tara` | `tara.webp` | `/public/assets/mythological/tara.webp` | P0 | needed | Real site, Co. Meath. Photography ideal |
| Brú na Bóinne | `bru-na-boinne` | `bru-na-boinne.webp` | `/public/assets/mythological/bru-na-boinne.webp` | P0 | needed | Newgrange passage tomb |
| Hill of Uisneach | `uisneach` | `uisneach.webp` | `/public/assets/mythological/uisneach.webp` | P1 | needed | Co. Westmeath; the Catstone |
| Tailteann | `tailteann` | `tailteann.webp` | `/public/assets/mythological/tailteann.webp` | P1 | needed | Co. Meath; ancient assembly site |
| Kildare — Brigid's Flame | `kildare` | `kildare.webp` | `/public/assets/mythological/kildare.webp` | P1 | needed | St Brigid's Cathedral; the flame |
| Tory Island | `tory-island` | `tory-island.webp` | `/public/assets/mythological/tory-island.webp` | P1 | needed | Co. Donegal; Balor's stronghold |
| First Battle of Mag Tuired | `mag-tuired-south` | `mag-tuired-south.webp` | `/public/assets/mythological/mag-tuired-south.webp` | P2 | needed | Near Cong, Co. Mayo |
| Second Battle of Mag Tuired | `mag-tuired-north` | `mag-tuired.webp` | `/public/assets/mythological/mag-tuired.webp` | P1 | needed | Near Moytirra, Co. Sligo; Lough Arrow |
| Lough Derravaragh | `lough-derravaragh` | `lough-derravaragh.webp` | `/public/assets/mythological/lough-derravaragh.webp` | P0 | needed | Co. Westmeath; Children of Lir |

### Ulster — 8 physical places

| Display Name | ID | Filename | Full path | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Emain Macha | `emain-macha` | `emain-macha.webp` | `/public/assets/ulster/emain-macha.webp` | P0 | needed | Navan Fort, Co. Armagh |
| Rathcroghan | `rathcroghan` | `rathcroghan.webp` | `/public/assets/ulster/rathcroghan.webp` | P1 | needed | Co. Roscommon; Medb's court |
| Cooley Peninsula | `cooley` | `cooley.webp` | `/public/assets/ulster/cooley.webp` | P1 | needed | Co. Louth; the Brown Bull's home |
| Áth Fhirdia (Ford of Ferdia) | `ath-fhirdia` | `ath-fhirdia.webp` | `/public/assets/ulster/ath-fhirdia.webp` | P1 | needed | Near Ardee, Co. Louth |
| Dún Dealgan | `dun-dealgan` | `dun-dealgan.webp` | `/public/assets/ulster/dun-dealgan.webp` | P1 | needed | Dundalk; Cú Chulainn's birthplace |
| Knocknarea | `knocknarea` | `knocknarea.webp` | `/public/assets/ulster/knocknarea.webp` | P1 | needed | Co. Sligo; Medb's cairn |
| Slieve Gullion | `slieve-gullion` | `slieve-gullion.webp` | `/public/assets/ulster/slieve-gullion.webp` | P1 | needed | Co. Armagh; lake of the grey horse |
| Cave of the Cats | `cave-of-cats` | `cave-of-cats.webp` | `/public/assets/ulster/cave-of-cats.webp` | P2 | needed | Rathcroghan; entrance to the Otherworld |

### Fenian — 7 physical places

| Display Name | ID | Filename | Full path | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Hill of Allen | `hill-of-allen` | `hill-of-allen.webp` | `/public/assets/fenian/hill-of-allen.webp` | P0 | needed | Co. Kildare; Fionn's seat |
| Ben Bulben | `ben-bulben` | `ben-bulben.webp` | `/public/assets/fenian/ben-bulben.webp` | P0 | needed | Co. Sligo; iconic flat-topped mountain |
| River Boyne — Salmon | `boyne-salmon` | `boyne-salmon.webp` | `/public/assets/fenian/boyne-salmon.webp` | P0 | needed | The Well of Segais reach of the Boyne |
| Giant's Causeway | `giants-causeway` | `giants-causeway.webp` | `/public/assets/fenian/giants-causeway.webp` | P1 | needed | Co. Antrim; Fionn legend |
| Slieve Bloom Mountains | `slieve-bloom` | `slieve-bloom.webp` | `/public/assets/fenian/slieve-bloom.webp` | P1 | needed | Co. Offaly/Laois; Fionn's childhood |
| Lough Leane | `lough-leane` | `lough-leane.webp` | `/public/assets/fenian/lough-leane.webp` | P1 | needed | Killarney; Oisín's departure |
| Tír na nÓg | `tir-na-nog` | `tir-na-nog.webp` | `/public/assets/fenian/tir-na-nog.webp` | P1 | needed | Otherworld — illustrative, not photograph |

---

## 6. Character / Deity Map Panels (17 slots)

These are separate from character portrait slots. The map panel is a wider atmospheric illustration shown in the location detail panel. Different composition than the portrait.
Path: `/public/assets/<cycle>/<imageFile>`

### Mythological — 7 deity / character panels

| Display Name | ID | Filename | Full path | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| The Dagda | `the-dagda` | `the-dagda.webp` | `/public/assets/mythological/the-dagda.webp` | P1 | needed | Atmospheric; different from portrait slot |
| Lugh Lámhfhada | `lugh` (map) | `lugh.webp` | `/public/assets/mythological/lugh.webp` | P1 | needed | Separate from `/assets/characters/lugh.webp` |
| Brigid | `brigid` | `brigid.webp` | `/public/assets/mythological/brigid.webp` | P1 | needed | Flame; hearth; not in character slots |
| The Morrígan | `the-morrigan` (map) | `the-morrigan.webp` | `/public/assets/mythological/the-morrigan.webp` | P1 | needed | Separate from character portrait |
| Nuada Airgetlám | `nuada` (map) | `nuada.webp` | `/public/assets/mythological/nuada.webp` | P2 | needed | Separate from character portrait |
| Manannán mac Lir | `manannan` | `manannan.webp` | `/public/assets/mythological/manannan.webp` | P1 | needed | Sea; chariot; different from portrait |
| Fate of the Children of Lír | `children-of-lir` | `children-of-lir.webp` | `/public/assets/mythological/children-of-lir.webp` | P1 | needed | Story scene panel on the map |

### Ulster — 7 character map panels

| Display Name | ID | Filename | Full path | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Cú Chulainn | `cu-chulainn` (map) | `cu-chulainn.webp` | `/public/assets/ulster/cu-chulainn.webp` | P1 | needed | Map panel; different from portrait |
| Queen Medb | `queen-medb` | `queen-medb.webp` | `/public/assets/ulster/queen-medb.webp` | P1 | needed | Rathcroghan setting |
| Ailill mac Máta | `ailill` (map) | `ailill.webp` | `/public/assets/ulster/ailill.webp` | P2 | needed | Map panel |
| Conchobar mac Nessa | `conchobar` (map) | `conchobar.webp` | `/public/assets/ulster/conchobar.webp` | P2 | needed | Map panel |
| Ferdia mac Daman | `ferdia` | `ferdia.webp` | `/public/assets/ulster/ferdia.webp` | P1 | needed | The ford; confrontation |
| Deirdre of the Sorrows | `deirdre` (map) | `deirdre.webp` | `/public/assets/ulster/deirdre.webp` | P1 | needed | Map scene panel |
| Táin Bó Cúailnge | `tain-bo-cuailnge` (map) | `tain.webp` | `/public/assets/ulster/tain.webp` | P0 | needed | Map story scene panel |

### Fenian — 5 character map panels

| Display Name | ID | Filename | Full path | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Fionn mac Cumhaill | `fionn` | `fionn.webp` | `/public/assets/fenian/fionn.webp` | P1 | needed | Map panel; different from portrait |
| Oisín | `oisin` (map) | `oisin.webp` | `/public/assets/fenian/oisin.webp` | P1 | needed | Map panel |
| Diarmuid ua Duibhne | `diarmuid` (map) | `diarmuid.webp` | `/public/assets/fenian/diarmuid.webp` | P1 | needed | Map panel |
| Gráinne | `grainne` (map) | `grainne.webp` | `/public/assets/fenian/grainne.webp` | P1 | needed | Map panel |
| Oscar | `oscar` (map) | `oscar.webp` | `/public/assets/fenian/oscar.webp` | P1 | needed | Map panel |

---

## 7. Group and Thematic Panels (7 slots)

Path: `/public/assets/<cycle>/<imageFile>`

| Display Name | ID | Filename | Full path | Cycle | Priority | Status | Notes |
|---|---|---|---|---|---|---|---|
| Tuatha Dé Danann | `tuatha-de-danann` | `tuatha-de-danann.webp` | `/public/assets/mythological/tuatha-de-danann.webp` | Mythological | P1 | needed | The assembled gods; impressionistic |
| Fomorians | `fomorians` | `fomorians.webp` | `/public/assets/mythological/fomorians.webp` | Mythological | P1 | needed | The opposing force; dark; oceanic |
| Red Branch Knights | `red-branch` | `red-branch.webp` | `/public/assets/ulster/red-branch.webp` | Ulster | P1 | needed | Assembled warriors; hall setting |
| The Brown Bull of Cooley | `brown-bull` | `brown-bull.webp` | `/public/assets/ulster/brown-bull.webp` | Ulster | P1 | needed | Supernatural bull; dark landscape |
| The Fianna | `the-fianna` | `the-fianna.webp` | `/public/assets/fenian/the-fianna.webp` | Fenian | P1 | needed | Assembled Fianna; forest or hillside |
| Battle of Gabhra | `battle-of-gabhra` | `battle-of-gabhra.webp` | `/public/assets/fenian/battle-of-gabhra.webp` | Fenian | P1 | needed | The end; aftermath; Oscar's death |
| Pursuit of Diarmuid and Gráinne | `pursuit-of-diarmuid` (map) | `pursuit-of-diarmuid.webp` | `/public/assets/fenian/pursuit-of-diarmuid.webp` | Fenian | P1 | needed | The flight across Ireland |

---

## Summary counts by priority

| Priority | Count | Description |
|---|---|---|
| P0 | 24 | Demo-critical — produce first |
| P1 | 78 | Covers all 18 stories fully |
| P2 | 42 | Completeness |
| **Total** | **144** | |

## Notes on duplicate naming

Several characters have both a **portrait slot** (`/assets/characters/`) and a **map panel slot** (`/assets/<cycle>/`). These need different compositions:

| Character | Portrait path | Map panel path |
|---|---|---|
| Cú Chulainn | `/assets/characters/cu-chulainn.webp` | `/assets/ulster/cu-chulainn.webp` |
| Lugh | `/assets/characters/lugh.webp` | `/assets/mythological/lugh.webp` |
| The Morrígan | `/assets/characters/the-morrigan.webp` | `/assets/mythological/the-morrigan.webp` |
| Conchobar | `/assets/characters/conchobar.webp` | `/assets/ulster/conchobar.webp` |
| Deirdre | `/assets/characters/deirdre.webp` | `/assets/ulster/deirdre.webp` |
| Nuada | `/assets/characters/nuada.webp` | `/assets/mythological/nuada.webp` |
| Fionn | `/assets/characters/fionn-mac-cumhaill.webp` | `/assets/fenian/fionn.webp` |
| Oisín | `/assets/characters/oisin.webp` | `/assets/fenian/oisin.webp` |
| Diarmuid | `/assets/characters/diarmuid.webp` | `/assets/fenian/diarmuid.webp` |
| Gráinne | `/assets/characters/grainne.webp` | `/assets/fenian/grainne.webp` |
| Oscar | `/assets/characters/oscar.webp` | `/assets/fenian/oscar.webp` |
| Ailill | `/assets/characters/ailill.webp` | `/assets/ulster/ailill.webp` |
| Manannán | `/assets/characters/manannan-mac-lir.webp` | `/assets/mythological/manannan.webp` |
