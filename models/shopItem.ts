// shopItems.ts

// Define interface for a shop item
interface ShopItem {
    id: string;
    name: string;
    type: string;
    options: string[]; // Array of strings or URLs
    price: number;

}


// Example shop items
const shopItems: ShopItem[] = [
    { id: '1', name: 'Font 1', type: 'font', options: ['bright', 'sunlight', 'bold'], price: 500 },
    { id: '2', name: 'Font 2', type: 'font', options: ['italic', 'script', 'handwritten'], price: 1000 },
    { id: '3', name: 'Profile Picture 1', type: 'picture', options: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWLHshlGc0PZMvu5I2pY4FYcNsVgkpGQ16uEfOvb2FS0nbG4XmYU8vFd1ibaNrbGugSd0&usqp=CAU', 'https://wallpapers.com/images/hd/instagram-profile-pictures-zjif3vdfrrxa00q6.jpg', 'https://i3.wp.com/wallpapers.com/images/hd/cute-girl-vector-art-profile-picture-jhbu3wt713zj2bti.jpg', "https://image.lexica.art/full_jpg/7515495b-982d-44d2-9931-5a8bbbf27532"], price: 400 },
    { id: '4', name: 'Profile Picture 2', type: 'picture', options: ['https://i.pinimg.com/736x/2d/e3/db/2de3db0ebe9bbfd5125e59aaae82134e.jpg', 'https://dp.profilepics.in/profile_pictures/amazing/amazing_profile_pictures_266.jpg', 'https://qph.cf2.quoracdn.net/main-qimg-428113a0fc91a5dd9a59d3ea8a7c12ef-lq'], price: 300 },
    { id: '5', name: 'Background 1', type: 'background', options: ['https://c4.wallpaperflare.com/wallpaper/486/221/268/spots-rainbow-background-light-wallpaper-thumb.jpg', 'https://img.freepik.com/free-vector/hand-painted-watercolor-pastel-sky-background_23-2148902771.jpg', 'https://wallpapergod.com/images/hd/background-2560X1600-wallpaper-qdhu8vmv2imefsky.jpeg'], price: 250 },
    { id: '6', name: 'Border 1', type: 'border', options: ['gold', 'bright blue', 'shadow'], price: 150 }
];

export default shopItems;
