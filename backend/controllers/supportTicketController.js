import SupportTicket from '../models/supportTicket.js';
import SupportMessage from '../models/supportMessage.js';
import User from '../models/user.js';
import Store from '../models/store.js';
import { Op } from 'sequelize';

// Create a new support ticket (Store Owner)
export const createTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId, subject, message, category, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      userId,
      storeId: storeId || null,
      subject,
      message,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open'
    });

    // Create initial message
    await SupportMessage.create({
      ticketId: ticket.id,
      userId,
      message
    });

    const ticketWithDetails = await SupportTicket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Store, attributes: ['id', 'storeName', 'domainName'] }
      ]
    });

    res.status(201).json(ticketWithDetails);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
};

// Get tickets for current user (Store Owner)
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const tickets = await SupportTicket.findAll({
      where: whereClause,
      include: [
        { model: Store, attributes: ['id', 'storeName', 'domainName'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
};

// Get all tickets (Super Admin)
export const getAllTickets = async (req, res) => {
  try {
    const { status, category, priority } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (priority) whereClause.priority = priority;

    const tickets = await SupportTicket.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Store, attributes: ['id', 'storeName', 'domainName'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
};

// Get ticket with messages
export const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await SupportTicket.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Store, attributes: ['id', 'storeName', 'domainName'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check access: user can only see their own tickets unless super admin
    if (userRole !== 'super_admin' && ticket.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get messages (filter internal messages for non-super-admins)
    const messageWhere = { ticketId: id };
    if (userRole !== 'super_admin') {
      messageWhere.isInternal = false;
    }

    const messages = await SupportMessage.findAll({
      where: messageWhere,
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ ticket, messages });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
};

// Add message to ticket
export const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { message, isInternal } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && ticket.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create message
    const newMessage = await SupportMessage.create({
      ticketId: id,
      userId,
      message,
      isInternal: isInternal && req.user.role === 'super_admin' ? true : false
    });

    // Update ticket
    const updateData = {
      lastRepliedBy: userId,
      lastRepliedAt: new Date()
    };

    // Auto-assign to super admin if store owner replies
    if (req.user.role === 'admin' && ticket.status === 'open') {
      updateData.status = 'in_progress';
    }

    // Mark as resolved if super admin replies
    if (req.user.role === 'super_admin' && ticket.status !== 'resolved') {
      updateData.status = 'in_progress';
    }

    await ticket.update(updateData);

    const messageWithUser = await SupportMessage.findByPk(newMessage.id, {
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }
      ]
    });

    res.status(201).json(messageWithUser);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Error adding message', error: error.message });
  }
};

// Update ticket status (Super Admin)
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;

    await ticket.update(updateData);

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Error updating ticket', error: error.message });
  }
};

