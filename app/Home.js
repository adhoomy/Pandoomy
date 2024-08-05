import { useState, useEffect } from 'react';
import { auth, firestore } from './firebase';
import { collection, query, getDocs, setDoc, deleteDoc, doc, getDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Box, Typography, Modal, Stack, TextField, Button, Grid } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserName(userDoc.data().name);
        } else {
          console.error('No such document!');
        }
        await updateInventory(currentUser.uid);
      } else {
        setUser(null);
        setInventory([]);
      }
    });
  }, []);

  const updateInventory = async (userId) => {
    try {
      const snapshot = query(collection(firestore, 'inventory'), where('userId', '==', userId));
      const docs = await getDocs(snapshot);
      const inventoryList = [];
      docs.forEach((doc) => {
        inventoryList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setInventory(inventoryList);
      setFilteredInventory(inventoryList);
      console.log('Inventory updated:', inventoryList);
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const addItem = async (item, quantity) => {
    if (!item) return;
    const itemId = uuidv4();
    const docRef = doc(collection(firestore, 'inventory'), itemId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity: existingQuantity, userId } = docSnap.data();
        if (userId === user.uid) {
          await setDoc(docRef, { name: item, quantity: existingQuantity + quantity, userId: user.uid }, { merge: true });
        }
      } else {
        await setDoc(docRef, { name: item, quantity: quantity, userId: user.uid });
      }
      console.log('Item added:', { name: item, quantity: quantity, userId: user.uid });
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const removeItem = async (itemId) => {
    const docRef = doc(collection(firestore, 'inventory'), itemId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { ...docSnap.data(), quantity: quantity - 1 });
        }
      }
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const removeAllItems = async (itemId) => {
    const docRef = doc(collection(firestore, 'inventory'), itemId);
    try {
      await deleteDoc(docRef);
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error removing all items:', error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSearch = () => {
    const filtered = inventory.filter((item) => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredInventory(filtered);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        setInventory([]);
      })
      .catch((error) => {
        console.error('Error signing out: ', error);
      });
  };

  const getQuantityColor = (quantity) => {
    if (quantity <= 3) return 'red';
    if (quantity >= 4 && quantity <= 7) return 'orange';
    if (quantity >= 8) return 'green';
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
        backgroundColor: '#ffdab9', // pastel peach color
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        width="100%"
        p={2}
        sx={{
          flexDirection: { xs: 'column', md: 'row' }, // Responsive flex direction
          maxWidth: '800px', // Align with inventory list width
        }}
      >
        <Typography variant="h6" noWrap>{userName}&apos;s Pantry</Typography>
        <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: '#4B371C', // Light brown color
            '&:hover': {
              backgroundColor: '#6F5B3E', // Lighter shade of light brown for hover
            },
            mt: { xs: 2, md: 0 }, // Responsive margin top
            '@media (max-width:600px)': {
              size: 'small', // Smaller size on small screens
            },
          }}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          boxShadow={24}
          p={4}
          display="flex"
          alignItems="center"
          gap={3}
          sx={{
            transform: 'translate(-50%,-50%)',
            borderRadius: '16px', // Curved borders
          }}
        >
          <Typography variant="h6">Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
              }}
              placeholder="Name"
            />
            <TextField
              variant="outlined"
              type="number"
              value={itemQuantity}
              onChange={(e) => {
                setItemQuantity(parseInt(e.target.value, 10));
              }}
              placeholder="Quantity"
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName, itemQuantity);
                setItemName('');
                setItemQuantity(1);
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: '800px', alignItems: 'center' }}>
        <Grid item xs={12} md={9}>
          <Box display="flex" gap={2} alignItems="center" sx={{ width: '100%' }}>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items"
              fullWidth
              sx={{ backgroundColor: '#fff', border: 'none', outline: 'none' }} // White background for search tab, no outline
            />
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#4B371C', // Light brown color
                '&:hover': {
                  backgroundColor: '#6F5B3E', // Lighter shade of light brown for hover
                },
              }}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12} md={3} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            sx={{
              width: '100%',
              backgroundColor: '#4B371C', // Light brown color
              '&:hover': {
                backgroundColor: '#6F5B3E', // Lighter shade of light brown for hover
              },
            }}
            onClick={handleOpen}
          >
            Add New Item
          </Button>
        </Grid>
      </Grid>
      <Box 
        width="100%" 
        maxWidth="800px" 
        mt={2} 
        sx={{ 
          backgroundColor: 'transparent', 
          borderRadius: '16px', // Add curved borders
          padding: 2,
        }} 
      >
        <Box
          width="100%"
          height="100px"
          bgcolor="#4B371C"
          display="flex"
          justifyContent="center"
          alignItems="center"
          borderRadius="16px" // Add curved borders
        >
          <Typography variant="h2" color="#FFFFFF" textAlign="center" noWrap>
            Pantry
          </Typography>
        </Box>
        <Stack
          width="100%"
          height="300px"
          spacing={2}
          overflow="auto"
          sx={{
            marginTop: 2, // Add space between the pantry and first item
            backgroundColor: 'transparent', // Remove background of items
          }}
        >
          {filteredInventory.map(({ id, name, quantity }) => (
            <Box
              key={id}
              width="100%"
              minHeight="100px"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              bgcolor="#fff"
              padding={1} // Reduce padding for better fit
              flexDirection={{ xs: 'column', md: 'row' }} // Column on small screens, row on larger screens
              sx={{
                borderRadius: '8px', // Rounded borders for items
                textAlign: { xs: 'center', sm: 'left' },
                '@media (max-width:600px)': {
                  gap: 1, // Add gap for spacing
                },
              }}
            >
              <Typography
                variant="h6"
                color="#333"
                sx={{ wordWrap: 'break-word', fontWeight: 'bold', flex: 1, minWidth: '0' }}
              >
                {name ? name.charAt(0).toUpperCase() + name.slice(1) : ''}
              </Typography>
              <Typography
                variant="h6"
                sx={{ 
                  wordWrap: 'break-word', 
                  fontWeight: 'bold', 
                  flexShrink: 0, 
                  minWidth: '50px', 
                  textAlign: 'center',
                  color: getQuantityColor(quantity)
                }}
              >
                {quantity}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  width: 'auto', // Ensure buttons fit properly
                  justifyContent: { xs: 'center', md: 'flex-end' },
                  flexWrap: 'wrap', // Allow buttons to wrap within the box
                }}
              >
                <Button
                  variant="contained"
                  size="small" // Reduce button size for small screens
                  sx={{
                    backgroundColor: 'green',
                    '&:hover': {
                      backgroundColor: '#66bb6a', // Lighter green for hover
                    },
                    borderRadius: '50%', // Circular buttons
                    minWidth: '36px', // Fixed size for circular buttons
                    height: '36px',
                    '@media (max-width:600px)': {
                      padding: '4px 8px', // Smaller padding
                    },
                  }}
                  onClick={() => addItem(name, 1)}
                >
                  +
                </Button>
                <Button
                  variant="contained"
                  size="small" // Reduce button size for small screens
                  sx={{
                    backgroundColor: 'red',
                    '&:hover': {
                      backgroundColor: '#ef5350', // Lighter red for hover
                    },
                    borderRadius: '50%', // Circular buttons
                    minWidth: '36px', // Fixed size for circular buttons
                    height: '36px',
                    '@media (max-width:600px)': {
                      padding: '4px 8px', // Smaller padding
                    },
                  }}
                  onClick={() => removeItem(id)}
                >
                  -
                </Button>
                <Button
                  variant="contained"
                  size="small" // Reduce button size for small screens
                  sx={{
                    backgroundColor: 'darkred',
                    '&:hover': {
                      backgroundColor: '#d32f2f', // Lighter dark red for hover
                    },
                    borderRadius: '8px', // Add curved borders
                    minWidth: '60px', // Fixed size for Remove All button
                    height: '36px',
                    '@media (max-width:600px)': {
                      padding: '4px 8px', // Smaller padding
                    },
                  }}
                  onClick={() => removeAllItems(id)}
                >
                  Remove All
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
