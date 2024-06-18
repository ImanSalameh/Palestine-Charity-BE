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
    { id: '1', name: 'Font 1 - Bright', type: 'font', price: 600 },
    { id: '2', name: 'Font 1 - Sunlight', type: 'font', price: 600 },
    { id: '3', name: 'Font 1 - Bold', type: 'font', price: 600 },
    { id: '4', name: 'Font 2 - Italic', type: 'font', price: 1000 },
    { id: '5', name: 'Font 2 - Script', type: 'font', price: 1000 },
    { id: '6', name: 'Font 2 - Handwritten', type: 'font', price: 1000 },
    { id: '7', name: 'Profile Picture 1', type: 'picture', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWLHshlGc0PZMvu5I2pY4FYcNsVgkpGQ16uEfOvb2FS0nbG4XmYU8vFd1ibaNrbGugSd0&usqp=CAU', price: 400 },
    { id: '8', name: 'Profile Picture 2', type: 'picture', url: 'https://wallpapers.com/images/hd/instagram-profile-pictures-zjif3vdfrrxa00q6.jpg', price: 400 },
    { id: '9', name: 'Profile Picture 3', type: 'picture', url: 'https://i3.wp.com/wallpapers.com/images/hd/cute-girl-vector-art-profile-picture-jhbu3wt713zj2bti.jpg', price: 400 },
    { id: '10', name: 'Profile Picture 4', type: 'picture', url: 'https://image.lexica.art/full_jpg/7515495b-982d-44d2-9931-5a8bbbf27532', price: 400 },
    { id: '11', name: 'Profile Picture 5', type: 'picture', url: 'https://i.pinimg.com/736x/2d/e3/db/2de3db0ebe9bbfd5125e59aaae82134e.jpg', price: 300 },
    { id: '12', name: 'Profile Picture 6', type: 'picture', url: 'https://dp.profilepics.in/profile_pictures/amazing/amazing_profile_pictures_266.jpg', price: 300 },
    { id: '13', name: 'Profile Picture 7', type: 'picture', url: 'https://qph.cf2.quoracdn.net/main-qimg-428113a0fc91a5dd9a59d3ea8a7c12ef-lq', price: 300 },
    { id: '14', name: 'Background 1', type: 'background', url: 'https://c4.wallpaperflare.com/wallpaper/486/221/268/spots-rainbow-background-light-wallpaper-thumb.jpg', price: 250 },
    { id: '15', name: 'Background 2', type: 'background', url: 'https://img.freepik.com/free-vector/hand-painted-watercolor-pastel-sky-background_23-2148902771.jpg', price: 250 },
    { id: '16', name: 'Background 3', type: 'background', url: 'https://wallpapergod.com/images/hd/background-2560X1600-wallpaper-qdhu8vmv2imefsky.jpeg', price: 250 },
    { id: '17', name: 'Border 1 - Gold', type: 'border', price: 150 },
    { id: '18', name: 'Border 2 - Bright Blue', type: 'border', price: 150 },
    { id: '19', name: 'Border 3 - Shadow', type: 'border', price: 150 },
];

export default shopItems;
