from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, UniqueConstraint, Boolean, DateTime
from sqlalchemy.orm import relationship, Session
from sqlalchemy import text
from database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id             = Column(String,  primary_key=True, index=True)   # UUID
    email          = Column(String,  unique=True, nullable=False, index=True)
    name           = Column(String,  nullable=True)
    avatar_url     = Column(String,  nullable=True)
    # Password auth — null if google-only user
    hashed_password = Column(String, nullable=True)
    # Google OAuth — null if email/password user
    google_id      = Column(String,  unique=True, nullable=True, index=True)
    created_at     = Column(DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return f"<User id={self.id!r} email={self.email!r}>"


class Node(Base):
    __tablename__ = "nodes"

    id          = Column(String,  primary_key=True, index=True)
    user_id     = Column(String,  nullable=False, index=True)
    label       = Column(String,  nullable=False)
    status      = Column(String,  nullable=False, default="recommended")
    level       = Column(Integer, nullable=False, default=0)
    position_x  = Column(Float,   nullable=False, default=0.0)
    position_y  = Column(Float,   nullable=False, default=0.0)
    description = Column(Text,    nullable=True)
    explanation = Column(Text,    nullable=True)

    _practice_problems = Column("practice_problems", Text, nullable=True, default="")
    _related_topics    = Column("related_topics",    Text, nullable=True, default="")

    incoming_edges = relationship(
        "Edge", foreign_keys="Edge.target_id",
        back_populates="target_node", cascade="all, delete-orphan",
    )
    outgoing_edges = relationship(
        "Edge", foreign_keys="Edge.source_id",
        back_populates="source_node", cascade="all, delete-orphan",
    )
    resources = relationship(
        "NodeResource", back_populates="node", cascade="all, delete-orphan",
    )

    @property
    def practice_problems(self):
        if not self._practice_problems:
            return []
        return [p.strip() for p in self._practice_problems.split("|") if p.strip()]

    @practice_problems.setter
    def practice_problems(self, value: list):
        self._practice_problems = "|".join(value) if value else ""

    @property
    def related_topics(self):
        if not self._related_topics:
            return []
        return [t.strip() for t in self._related_topics.split("|") if t.strip()]

    @related_topics.setter
    def related_topics(self, value: list):
        self._related_topics = "|".join(value) if value else ""


class NodeResource(Base):
    __tablename__ = "node_resources"

    id      = Column(Integer, primary_key=True, autoincrement=True)
    node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    title   = Column(String, nullable=False)
    type    = Column(String, nullable=False)

    node = relationship("Node", back_populates="resources")


class Edge(Base):
    __tablename__ = "edges"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    target_id = Column(String, ForeignKey("nodes.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("source_id", "target_id", name="uq_edge"),
    )

    source_node = relationship("Node", foreign_keys=[source_id], back_populates="outgoing_edges")
    target_node = relationship("Node", foreign_keys=[target_id], back_populates="incoming_edges")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id      = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String,  nullable=False, index=True)
    node_id = Column(String,  ForeignKey("nodes.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "node_id", name="uq_user_node"),
    )

    node = relationship("Node")


def get_all_prerequisites(db: Session, node_id: str) -> list:
    cte_sql = text("""
        WITH RECURSIVE prereqs(node_id) AS (
            SELECT source_id AS node_id
            FROM   edges
            WHERE  target_id = :start

            UNION

            SELECT e.source_id
            FROM   edges e
            JOIN   prereqs p ON e.target_id = p.node_id
        )
        SELECT DISTINCT node_id FROM prereqs
    """)
    rows = db.execute(cte_sql, {"start": node_id}).fetchall()
    prereq_ids = [row[0] for row in rows]
    if not prereq_ids:
        return []
    return db.query(Node).filter(Node.id.in_(prereq_ids)).all()
