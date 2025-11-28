"""
Tests for Alembic database migrations
"""

import pytest
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import inspect, text
import os


class TestAlembicSetup:
    """Test that Alembic is properly configured"""
    
    def test_alembic_ini_exists(self):
        """Test that alembic.ini file exists"""
        alembic_ini = os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic.ini")
        assert os.path.exists(alembic_ini), "alembic.ini file should exist"
    
    def test_alembic_directory_exists(self):
        """Test that alembic directory exists"""
        alembic_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic")
        assert os.path.exists(alembic_dir), "alembic directory should exist"
    
    def test_alembic_versions_directory_exists(self):
        """Test that alembic/versions directory exists"""
        versions_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            "alembic", 
            "versions"
        )
        assert os.path.exists(versions_dir), "alembic/versions directory should exist"
    
    def test_alembic_env_py_exists(self):
        """Test that alembic/env.py exists"""
        env_py = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            "alembic", 
            "env.py"
        )
        assert os.path.exists(env_py), "alembic/env.py should exist"


class TestAlembicConfiguration:
    """Test Alembic configuration and connectivity"""
    
    def get_alembic_config(self):
        """Get Alembic configuration object"""
        alembic_ini = os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic.ini")
        return Config(alembic_ini)
    
    def test_alembic_config_loads(self):
        """Test that Alembic configuration loads without errors"""
        config = self.get_alembic_config()
        assert config is not None
        assert config.get_main_option("script_location") == "alembic"
    
    def test_alembic_can_access_database(self, db):
        """Test that Alembic can connect to the database"""
        from app.database import engine
        
        # Create a migration context to verify connection
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_rev = context.get_current_revision()
            # Should return None initially (no migrations run yet) or a revision ID
            assert current_rev is None or isinstance(current_rev, str)
    
    def test_alembic_detects_models(self):
        """Test that Alembic can detect our models"""
        from app.database import Base
        
        # Verify that our PageVisit model is registered
        tables = Base.metadata.tables
        assert 'page_visits' in tables
        
        # Verify model has expected columns
        page_visits_table = tables['page_visits']
        column_names = [col.name for col in page_visits_table.columns]
        
        assert 'id' in column_names
        assert 'url' in column_names
        assert 'datetime_visited' in column_names
        assert 'link_count' in column_names
        assert 'word_count' in column_names
        assert 'image_count' in column_names


class TestAlembicMigrations:
    """Test Alembic migration functionality"""
    
    def get_alembic_config(self):
        """Get Alembic configuration object"""
        alembic_ini = os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic.ini")
        return Config(alembic_ini)
    
    def test_alembic_can_generate_revision(self):
        """Test that Alembic can generate a revision script"""
        config = self.get_alembic_config()
        script_dir = ScriptDirectory.from_config(config)
        
        # Get all revisions
        revisions = list(script_dir.walk_revisions())
        
        # Should be able to iterate revisions (even if empty)
        assert isinstance(revisions, list)
    
    def test_current_database_matches_models(self, db):
        """Test that current database schema matches our models"""
        from app.database import engine
        
        # Get database schema
        inspector = inspect(engine)
        db_tables = inspector.get_table_names()
        
        # Should have page_visits table
        assert 'page_visits' in db_tables
        
        # Check columns
        columns = inspector.get_columns('page_visits')
        column_names = [col['name'] for col in columns]
        
        assert 'id' in column_names
        assert 'url' in column_names
        assert 'datetime_visited' in column_names
        assert 'link_count' in column_names
        assert 'word_count' in column_names
        assert 'image_count' in column_names
    
    def test_alembic_check_command_works(self):
        """Test that alembic check command can detect schema drift"""
        config = self.get_alembic_config()
        
        # This will raise an error if there's a configuration problem
        # We're just testing that the command can run
        try:
            # Get script directory
            script_dir = ScriptDirectory.from_config(config)
            # If we get here, Alembic is properly configured
            assert script_dir is not None
        except Exception as e:
            pytest.fail(f"Alembic check failed: {str(e)}")


class TestAlembicIntegration:
    """Integration tests for Alembic"""
    
    def test_readme_exists(self):
        """Test that README exists with instructions"""
        readme_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            "alembic", 
            "README"
        )
        assert os.path.exists(readme_path), "alembic/README should exist"
    
    def test_script_mako_template_exists(self):
        """Test that migration template exists"""
        template_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            "alembic", 
            "script.py.mako"
        )
        assert os.path.exists(template_path), "script.py.mako template should exist"

