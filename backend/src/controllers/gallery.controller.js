// controllers/gallery.controller.js - UPDATED
const Report = require('../models/Report');
const Gallery = require('../models/Gallery');

// Get approved gallery items for public viewing - NOW FROM GALLERY COLLECTION
exports.getApprovedGallery = async (req, res) => {
  try {
    const { category, sort = 'newest', search, page = 1, limit = 12 } = req.query;
    
    // Build query for Gallery collection
    const query = {
      status: 'active'
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { approvedAt: -1 };
        break;
      case 'oldest':
        sortOption = { approvedAt: 1 };
        break;
      case 'featured':
        sortOption = { featured: -1, approvedAt: -1 };
        break;
      case 'popular':
        sortOption = { likeCount: -1 };
        break;
      default:
        sortOption = { approvedAt: -1 };
    }
    
    const skip = (page - 1) * limit;
    
    // Query Gallery collection directly
    const galleryItems = await Gallery.find(query)
      .populate('uploadedBy', 'name avatar')
      .populate('approvedBy', 'name')
      .populate('report', 'title description category location')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Gallery.countDocuments(query);
    
    // Transform data to match expected format
    const transformedItems = galleryItems.map(galleryItem => ({
      ...galleryItem.toObject(),
      _id: galleryItem.galleryImageRef || galleryItem._id,
      beforeImage: galleryItem.beforeImage,
      afterImage: galleryItem.afterImage,
      status: 'approved',
      uploadedAt: galleryItem.createdAt,
      uploadedBy: galleryItem.uploadedBy,
      approvedAt: galleryItem.approvedAt,
      approvedBy: galleryItem.approvedBy,
      featured: galleryItem.featured,
      views: galleryItem.views,
      likes: galleryItem.likes,
      likeCount: galleryItem.likeCount,
      report: galleryItem.report ? {
        _id: galleryItem.report._id,
        title: galleryItem.report.title,
        description: galleryItem.report.description,
        category: galleryItem.report.category,
        location: galleryItem.report.location,
        createdAt: galleryItem.report.createdAt
      } : null
    }));
    
    res.json({
      success: true,
      data: transformedItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get approved gallery error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get featured gallery items - FROM GALLERY COLLECTION
exports.getFeaturedGallery = async (req, res) => {
  try {
    const galleryItems = await Gallery.find({
      status: 'active',
      featured: true
    })
    .populate('uploadedBy', 'name avatar')
    .populate('report', 'title category location')
    .sort({ approvedAt: -1 })
    .limit(6);
    
    const featuredItems = galleryItems.map(galleryItem => ({
      ...galleryItem.toObject(),
      _id: galleryItem.galleryImageRef || galleryItem._id,
      beforeImage: galleryItem.beforeImage,
      afterImage: galleryItem.afterImage,
      status: 'approved',
      uploadedAt: galleryItem.createdAt,
      uploadedBy: galleryItem.uploadedBy,
      approvedAt: galleryItem.approvedAt,
      approvedBy: galleryItem.approvedBy,
      featured: galleryItem.featured,
      report: galleryItem.report ? {
        _id: galleryItem.report._id,
        title: galleryItem.report.title,
        category: galleryItem.report.category,
        location: galleryItem.report.location
      } : null
    }));
    
    res.json({
      success: true,
      data: featuredItems
    });
  } catch (error) {
    console.error('Get featured gallery error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get gallery by category - FROM GALLERY COLLECTION
exports.getGalleryByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;
    
    const galleryItems = await Gallery.find({
      category,
      status: 'active'
    })
    .populate('uploadedBy', 'name avatar')
    .populate('report', 'title location')
    .sort({ approvedAt: -1 })
    .limit(parseInt(limit));
    
    const categoryItems = galleryItems.map(galleryItem => ({
      ...galleryItem.toObject(),
      _id: galleryItem.galleryImageRef || galleryItem._id,
      beforeImage: galleryItem.beforeImage,
      afterImage: galleryItem.afterImage,
      status: 'approved',
      uploadedAt: galleryItem.createdAt,
      uploadedBy: galleryItem.uploadedBy,
      approvedAt: galleryItem.approvedAt,
      report: galleryItem.report ? {
        _id: galleryItem.report._id,
        title: galleryItem.report.title,
        location: galleryItem.report.location
      } : null
    }));
    
    res.json({
      success: true,
      data: categoryItems,
      count: categoryItems.length
    });
  } catch (error) {
    console.error('Get gallery by category error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Like a gallery image - NOW IN GALLERY COLLECTION
exports.likeGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find in Gallery collection
    const galleryItem = await Gallery.findOne({
      $or: [
        { _id: id },
        { galleryImageRef: id }
      ],
      status: 'active'
    });
    
    if (!galleryItem) {
      return res.status(404).json({ success: false, error: 'Gallery image not found' });
    }
    
    // Check if user already liked
    const userLikedIndex = galleryItem.likes ? 
      galleryItem.likes.indexOf(req.user._id) : -1;
    
    if (userLikedIndex === -1) {
      // Add like
      if (!galleryItem.likes) galleryItem.likes = [];
      galleryItem.likes.push(req.user._id);
      galleryItem.likeCount = (galleryItem.likeCount || 0) + 1;
    } else {
      // Remove like
      galleryItem.likes.splice(userLikedIndex, 1);
      galleryItem.likeCount = Math.max(0, (galleryItem.likeCount || 1) - 1);
    }
    
    await galleryItem.save();
    
    res.json({
      success: true,
      liked: userLikedIndex === -1,
      likeCount: galleryItem.likeCount || 0
    });
  } catch (error) {
    console.error('Like gallery image error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get gallery image details - FROM GALLERY COLLECTION
exports.getGalleryDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const galleryItem = await Gallery.findOne({
      $or: [
        { _id: id },
        { galleryImageRef: id }
      ],
      status: 'active'
    })
    .populate('uploadedBy', 'name email avatar')
    .populate('approvedBy', 'name')
    .populate('report', 'title description category location')
    .populate('likes', 'name avatar');
    
    if (!galleryItem) {
      return res.status(404).json({ success: false, error: 'Gallery image not found' });
    }
    
    // Increment view count
    galleryItem.views = (galleryItem.views || 0) + 1;
    await galleryItem.save();
    
    const responseData = {
      ...galleryItem.toObject(),
      _id: galleryItem.galleryImageRef || galleryItem._id,
      beforeImage: galleryItem.beforeImage,
      afterImage: galleryItem.afterImage,
      status: 'approved',
      uploadedAt: galleryItem.createdAt,
      uploadedBy: galleryItem.uploadedBy,
      approvedAt: galleryItem.approvedAt,
      approvedBy: galleryItem.approvedBy,
      featured: galleryItem.featured,
      views: galleryItem.views,
      likes: galleryItem.likes,
      likeCount: galleryItem.likeCount,
      report: galleryItem.report ? {
        _id: galleryItem.report._id,
        title: galleryItem.report.title,
        description: galleryItem.report.description,
        category: galleryItem.report.category,
        location: galleryItem.report.location,
        createdAt: galleryItem.report.createdAt
      } : null
    };
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get gallery details error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// NEW: Migration function to sync existing approved images to Gallery collection
exports.migrateToGallery = async (req, res) => {
  try {
    console.log('🔄 Starting migration of approved images to Gallery collection...');
    
    // Find all reports with approved gallery images
    const reports = await Report.find({
      'galleryImages.status': 'approved'
    })
    .populate('galleryImages.uploadedBy', 'name email avatar')
    .populate('galleryImages.approvedBy', 'name');
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const report of reports) {
      const approvedImages = report.galleryImages.filter(img => img.status === 'approved');
      
      for (const galleryImage of approvedImages) {
        try {
          // Check if already exists in Gallery
          const existing = await Gallery.findOne({
            galleryImageRef: galleryImage._id
          });
          
          if (!existing) {
            const newGallery = new Gallery({
              galleryImageRef: galleryImage._id,
              report: report._id,
              beforeImage: galleryImage.beforeImage,
              afterImage: galleryImage.afterImage,
              title: report.title,
              description: report.description || `${report.category} transformation`,
              category: report.category,
              location: report.location,
              uploadedBy: galleryImage.uploadedBy,
              approvedBy: galleryImage.approvedBy,
              approvedAt: galleryImage.approvedAt || new Date(),
              featured: galleryImage.featured || false,
              views: 0,
              likes: [],
              likeCount: 0,
              tags: [report.category, 'transformation', 'before-after'],
              status: 'active'
            });
            
            await newGallery.save();
            migratedCount++;
            console.log(`✅ Migrated: ${report.title} - ${galleryImage._id}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error migrating ${galleryImage._id}:`, error.message);
        }
      }
    }
    
    console.log(`🎉 Migration complete! Migrated: ${migratedCount}, Errors: ${errorCount}`);
    
    res.json({
      success: true,
      message: `Migration complete! Migrated ${migratedCount} images to Gallery collection.`,
      stats: {
        migrated: migratedCount,
        errors: errorCount,
        totalReports: reports.length
      }
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get gallery items for specific user
 * @route GET /api/gallery/user/:userId
 * @access Private
 */
exports.getUserGallery = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      page = 1, 
      limit = 12, 
      sort = '-createdAt',
      category,
      featured,
      search 
    } = req.query;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Check if user exists
    const userExists = await User.findById(userId).select('_id name email');
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build query for user's gallery items
    const query = { 
      status: 'approved',
      $or: [
        { userId: new mongoose.Types.ObjectId(userId) },
        { uploadedBy: userId },
        // Get gallery items from user's reports
        { reportId: { $in: await getReportIdsForUser(userId) } }
      ]
    };

    // Apply filters
    if (category && category !== 'all') {
      query['report.category'] = category;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    // Apply search
    if (search && search.trim() !== '') {
      query.$or = [
        { 'report.title': { $regex: search, $options: 'i' } },
        { 'report.category': { $regex: search, $options: 'i' } },
        { 'afterImage.caption': { $regex: search, $options: 'i' } },
        { 'beforeImage.caption': { $regex: search, $options: 'i' } }
      ];
    }

    // Parse sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
      case '-createdAt':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
      case 'createdAt':
        sortOptions = { createdAt: 1 };
        break;
      case 'likes':
        sortOptions = { likeCount: -1 };
        break;
      case 'views':
        sortOptions = { views: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const galleryItems = await Gallery.find(query)
      .populate({
        path: 'report',
        select: 'title category location status completedAt',
        model: Report
      })
      .populate({
        path: 'uploadedBy',
        select: 'name email avatar',
        model: User
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalItems = await Gallery.countDocuments(query);

    // Format response
    const formattedItems = galleryItems.map(item => ({
      _id: item._id,
      status: item.status,
      featured: item.featured || false,
      beforeImage: {
        url: item.beforeImage?.url || '',
        caption: item.beforeImage?.caption || 'Before image',
        uploadedAt: item.beforeImage?.uploadedAt
      },
      afterImage: {
        url: item.afterImage?.url || '',
        caption: item.afterImage?.caption || 'After image',
        uploadedAt: item.afterImage?.uploadedAt
      },
      report: item.report ? {
        _id: item.report._id,
        title: item.report.title || 'Untitled Report',
        category: item.report.category || 'uncategorized',
        location: item.report.location || { address: 'Unknown Location' },
        status: item.report.status || 'completed'
      } : {
        title: 'Unknown Report',
        category: 'uncategorized',
        location: { address: 'Unknown Location' }
      },
      uploadedBy: item.uploadedBy ? {
        _id: item.uploadedBy._id,
        name: item.uploadedBy.name || 'User',
        email: item.uploadedBy.email,
        avatar: item.uploadedBy.avatar
      } : {
        name: 'User'
      },
      likeCount: item.likeCount || 0,
      views: item.views || 0,
      approvedAt: item.approvedAt || item.createdAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedItems,
      pagination: {
        total: totalItems,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalItems / limitNum),
        hasNextPage: pageNum * limitNum < totalItems,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('❌ Get user gallery error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user gallery',
      message: error.message
    });
  }
};

/**
 * Get gallery statistics for specific user
 * @route GET /api/gallery/user/:userId/stats
 * @access Private
 */
exports.getUserGalleryStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Check if user exists
    const userExists = await User.findById(userId).select('_id name');
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's report IDs
    const userReportIds = await getReportIdsForUser(userId);

    // Build aggregation pipeline
    const stats = await Gallery.aggregate([
      {
        $match: {
          status: 'approved',
          $or: [
            { userId: new mongoose.Types.ObjectId(userId) },
            { uploadedBy: userId },
            { reportId: { $in: userReportIds } }
          ]
        }
      },
      {
        $facet: {
          // Total items
          totalItems: [{ $count: "count" }],
          
          // Items by category
          byCategory: [
            {
              $group: {
                _id: "$report.category",
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Featured items
          featuredItems: [
            { $match: { featured: true } },
            { $count: "count" }
          ],
          
          // Monthly uploads (last 6 months)
          monthlyUploads: [
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 6 }
          ],
          
          // Total likes and views
          engagement: [
            {
              $group: {
                _id: null,
                totalLikes: { $sum: { $ifNull: ["$likeCount", 0] } },
                totalViews: { $sum: { $ifNull: ["$views", 0] } },
                avgLikes: { $avg: { $ifNull: ["$likeCount", 0] } },
                avgViews: { $avg: { $ifNull: ["$views", 0] } }
              }
            }
          ],
          
          // Most liked items
          mostLiked: [
            { $sort: { likeCount: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                'report.title': 1,
                likeCount: 1,
                featured: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ]);

    // Format the response
    const formattedStats = {
      totalItems: stats[0]?.totalItems[0]?.count || 0,
      featuredItems: stats[0]?.featuredItems[0]?.count || 0,
      categories: stats[0]?.byCategory || [],
      monthlyUploads: stats[0]?.monthlyUploads || [],
      engagement: stats[0]?.engagement[0] || {
        totalLikes: 0,
        totalViews: 0,
        avgLikes: 0,
        avgViews: 0
      },
      mostLiked: stats[0]?.mostLiked || []
    };

    // Add category distribution percentages
    if (formattedStats.totalItems > 0) {
      formattedStats.categories = formattedStats.categories.map(cat => ({
        ...cat,
        percentage: Math.round((cat.count / formattedStats.totalItems) * 100)
      }));
    }

    // Format monthly uploads
    formattedStats.monthlyUploads = formattedStats.monthlyUploads.map(item => ({
      year: item._id.year,
      month: item._id.month,
      count: item.count,
      label: `${new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' })} ${item._id.year}`
    })).reverse();

    res.status(200).json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('❌ Get user gallery stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user gallery statistics',
      message: error.message
    });
  }
};