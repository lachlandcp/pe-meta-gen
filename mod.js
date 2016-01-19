PLANKS_ID = 5;
TEXTURE_NAME = "...";
TEXTURE_NUM = 0;
ITEM_NAME = "New Texture Item";

function newLevel() {
    ModPE.setItem(440, TEXTURE_NAME, TEXTURE_NUM || 0, ITEM_NAME, 16);
}

function useItem(blockId) {
    if (blockId == PLANKS_ID) {
        Player.addItemInventory(440, 1, 0);
    }
}