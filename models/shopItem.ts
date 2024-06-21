// shopItems.ts

// Define interface for a shop item
interface ShopItem {
    id: string;
    name: string;
    type: string;
    url?: string; // Optional field for URL if the item is a picture or background
    price: number;
}


// Example shop items
const shopItems: ShopItem[] = [
    { id: '1', name: 'Bright', type: 'font', price: 600 },
    { id: '2', name: 'Sunlight', type: 'font', price: 600 },
    { id: '3', name: 'Bold', type: 'font', price: 600 },
    { id: '4', name: 'Italic', type: 'font', price: 1000 },
    { id: '5', name: 'Script', type: 'font', price: 1000 },
    { id: '6', name: 'Handwritten', type: 'font', price: 1000 },
    { id: '7', name: 'Profile Picture 1', type: 'picture', url: 'https://i.pinimg.com/564x/04/4c/88/044c880f4e32feef86fd4513b8a29aea.jpg', price: 400 },
    { id: '8', name: 'Profile Picture 2', type: 'picture', url: 'https://i.pinimg.com/564x/b3/ea/a3/b3eaa32ca240c8d8aa1b8dc77a393e33.jpg', price: 400 },
    { id: '9', name: 'Profile Picture 3', type: 'picture', url: 'https://i.pinimg.com/564x/57/bc/d6/57bcd63d8e47f9874dd369b24c08b097.jpg', price: 400 },
    { id: '10', name: 'Profile Picture 4', type: 'picture', url: 'https://i.pinimg.com/564x/da/a3/92/daa3929165c58dba482cb156188965db.jpg', price: 400 },
    { id: '14', name: 'Background 1', type: 'background', url: 'https://i.pinimg.com/564x/cd/c2/1a/cdc21a301e6fa29cdd48461d476c584b.jpg', price: 250 },
    { id: '15', name: 'Background 2', type: 'background', url: 'https://imgs.search.brave.com/LsHKfmWBkOKcqah2DpuLFwvHRP3l5k5TCnb-itnAV-E/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzBjLzYx/L2RhLzBjNjFkYTc5/ZDMxZjQzYWYxMjAy/YzNlNzA2NzVhMTE1/LmpwZw', price: 250 },
    { id: '16', name: 'Background 3', type: 'background', url: 'https://i.pinimg.com/564x/28/2e/1b/282e1bd7b1c486b05ddd0994da8670e1.jpg', price: 250 },
    { id: '17', name: 'Border 1 - Gold', type: 'border', price: 150 },
    { id: '18', name: 'Border 2 - Bright Blue', type: 'border', price: 150 },
    { id: '19', name: 'Border 3 - Shadow', type: 'border', price: 150 },
];

export default shopItems;
