import ContactMessage from '../models/ContactMessage.js';

// @desc    Submit a new contact message
// @route   POST /api/contact
// @access  Public
export const submitContactMessage = async (req, res, next) => {
  try {
    console.log('📨 Submit Contact Message Request Body:', req.body);
    const { name, email, message } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and message' });
    }
    
    const contact = await ContactMessage.create({
      name,
      email,
      message,
      ipAddress
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: contact
    });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    // Return actual error message for debugging
    res.status(500).json({ success: false, message: error.message || 'Server Error', error: error.message });
  }
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/admin/messages
// @access  Private/Admin
export const getAllMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    const statusFilter = req.query.status;
    const query = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};

    const total = await ContactMessage.countDocuments(query);
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: messages.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: messages
    });
  } catch (error) {
     console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update message status
// @route   PUT /api/admin/messages/:id/status
// @access  Private/Admin
export const updateMessageStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['unread', 'read', 'replied'].includes(status)) {
       return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/admin/messages/:id
// @access  Private/Admin
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
