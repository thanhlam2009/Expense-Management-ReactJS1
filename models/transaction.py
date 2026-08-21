from app import db
from datetime import datetime

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'income' or 'expense'
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date())
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    
    # Optional receipt image
    receipt_image = db.Column(db.String(200))
    
    def __repr__(self):
        return f'<Transaction {self.type}: {self.amount}>'
    
    def to_dict(self):
        result = {
            'id': self.id,
            'amount': self.amount,
            'type': self.type,
            'description': self.description,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id,
            'category_id': self.category_id,
            'receipt_image': self.receipt_image
        }
        
        # Include category info if available
        if self.category:
            result['category'] = {
                'id': self.category.id,
                'name': self.category.name,
                'type': self.category.type
            }
        
        # Include user info if available (for admin views)
        if self.user:
            result['user'] = {
                'id': self.user.id,
                'full_name': self.user.full_name,
                'email': self.user.email
            }
        
        return result 